'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { billingApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import { Receipt, CreditCard, CalendarClock, TrendingUp, Download } from 'lucide-react';

interface BillingInvoice {
  id: string;
  amountMinor?: number;
  amount?: number;
  currency?: string;
  status?: string;
  providerEventId?: string | null;
  createdAt: string;
}

interface BillingSubscription {
  id: string;
  tier?: string | null;
  status?: string | null;
  cycle?: string | null;
  amountMinor?: number;
  amount?: number;
  currency?: string;
  provider?: string | null;
  providerReference?: string | null;
  periodEndAt?: string | null;
  currentPeriodEnd?: string | null;
  createdAt?: string;
  invoices?: BillingInvoice[];
}

function formatDateLong(value?: string | null) {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString();
}

function normalizeAmountMinor(amountMinor?: number, amount?: number) {
  if (typeof amountMinor === 'number') return amountMinor;
  if (typeof amount === 'number') return Math.round(amount * 100);
  return 0;
}

function formatMoney(amountMinor: number, currency = 'NGN') {
  return `${currency.toUpperCase()} ${(amountMinor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export default function BillingPage() {
  const user = useBloxStore((state) => state.user);
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBilling = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await billingApi.getSubscription() as BillingSubscription | null;
      setSubscription(data);
    } catch (loadError) {
      setSubscription(null);
      setError(loadError instanceof Error ? loadError.message : 'Could not load billing data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const invoices = useMemo(() => subscription?.invoices ?? [], [subscription]);
  const nextBilling = subscription?.periodEndAt ?? subscription?.currentPeriodEnd ?? null;

  const conversionEvents = useMemo(() => {
    const events: Array<{ key: string; date: string; label: string; detail?: string }> = [];
    const subscriptionStart = subscription?.createdAt ?? invoices[0]?.createdAt ?? null;

    if (subscriptionStart && (subscription?.tier ?? user.tier) !== 'FREE') {
      events.push({
        key: 'upgrade-event',
        date: subscriptionStart,
        label: `Upgraded from FREE to ${subscription?.tier ?? user.tier}`,
        detail: `Effective on ${formatDateLong(subscriptionStart)}`,
      });
    }

    invoices.forEach((invoice) => {
      const amountMinor = normalizeAmountMinor(invoice.amountMinor, invoice.amount);
      events.push({
        key: invoice.id,
        date: invoice.createdAt,
        label: 'Payment recorded',
        detail: `${formatMoney(amountMinor, invoice.currency ?? subscription?.currency ?? 'NGN')} • Tx: ${
          invoice.providerEventId ?? subscription?.providerReference ?? 'N/A'
        }`,
      });
    });

    return events.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [invoices, subscription, user.tier]);

  const handleReceipt = useCallback((invoice: BillingInvoice) => {
    const amountMinor = normalizeAmountMinor(invoice.amountMinor, invoice.amount);
    const currency = invoice.currency ?? subscription?.currency ?? 'NGN';
    const itemLabel = `${subscription?.tier ?? user.tier} ${subscription?.cycle ?? 'PLAN'}`;
    const transactionId = invoice.providerEventId ?? subscription?.providerReference ?? 'N/A';
    const receiptNumber = invoice.id;

    const receiptWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!receiptWindow) return;

    receiptWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${escapeHtml(receiptNumber)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; margin: 0; padding: 24px; }
            h1 { margin: 0 0 4px 0; }
            .meta { color: #555; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
            .label { color: #444; }
            .value { font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>Receipt</h1>
          <p class="meta">Generated on ${escapeHtml(new Date().toLocaleString())}</p>
          <div class="row"><span class="label">Invoice Number</span><span class="value">${escapeHtml(receiptNumber)}</span></div>
          <div class="row"><span class="label">Date</span><span class="value">${escapeHtml(formatDateLong(invoice.createdAt))}</span></div>
          <div class="row"><span class="label">Amount</span><span class="value">${escapeHtml(formatMoney(amountMinor, currency))}</span></div>
          <div class="row"><span class="label">Item</span><span class="value">${escapeHtml(itemLabel)}</span></div>
          <div class="row"><span class="label">Transaction ID</span><span class="value">${escapeHtml(transactionId)}</span></div>
          <p style="margin-top: 20px; color: #555;">Payment processor: Paystack</p>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  }, [subscription, user.tier]);

  return (
    <FeaturePage
      title="Billing & Invoices"
      description="Track subscription status, conversion history, receipts, and invoice downloads in one place."
      headerIcon={<Receipt className="h-6 w-6" />}
    >
      <div className="space-y-6">
        {error ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Current Tier</p>
            <p className="mt-2 text-2xl font-black text-white">{subscription?.tier ?? user.tier}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Subscription Status</p>
            <p className="mt-2 text-2xl font-black text-white">{subscription?.status ?? 'FREE'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Next Billing Date</p>
            <p className="mt-2 text-2xl font-black text-white">{formatDate(nextBilling)}</p>
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1ECEFA]">
            <CreditCard className="h-4 w-4" /> Subscription & Payment Method
          </h2>
          {loading ? (
            <div className="h-20 animate-pulse rounded-xl bg-white/5" />
          ) : (
            <div className="space-y-2 text-sm text-slate-300">
              <p>
                Tier: <span className="font-bold text-white">{subscription?.tier ?? user.tier}</span>
              </p>
              <p>
                Cycle: <span className="font-bold text-white">{subscription?.cycle ?? 'N/A'}</span>
              </p>
              <p>
                Next billing date: <span className="font-bold text-white">{formatDateLong(nextBilling)}</span>
              </p>
              <p>
                Payment method: <span className="font-bold text-white">Paystack</span>
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/pricing"
              className="rounded-lg border border-[#1ECEFA]/40 bg-[#1ECEFA]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#1ECEFA] hover:bg-[#1ECEFA]/20"
            >
              Upgrade / Downgrade
            </Link>
            <Link
              href="/checkout"
              className="rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-[#1ECEFA]/40 hover:text-white"
            >
              Update Payment Method
            </Link>
          </div>
        </section>

        <section id="invoices" className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1ECEFA]">
            <Receipt className="h-4 w-4" /> Invoice & Receipt History
          </h2>

          {loading ? (
            <div className="h-24 animate-pulse rounded-xl bg-white/5" />
          ) : invoices.length === 0 ? (
            <p className="text-sm text-slate-400">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((invoice) => {
                const amountMinor = normalizeAmountMinor(invoice.amountMinor, invoice.amount);
                return (
                  <div
                    key={invoice.id}
                    className="flex flex-col gap-2 rounded-xl border border-white/10 bg-[#0d151d] p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="text-sm text-slate-300">
                      <p className="font-semibold text-white">Invoice {invoice.id.slice(0, 12)}</p>
                      <p className="text-xs text-slate-500">
                        {formatDateLong(invoice.createdAt)} • {formatMoney(amountMinor, invoice.currency ?? subscription?.currency ?? 'NGN')}
                      </p>
                      <p className="text-xs text-slate-500">
                        Tx ID: {invoice.providerEventId ?? subscription?.providerReference ?? 'N/A'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReceipt(invoice)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-[#1ECEFA]/40 hover:text-white"
                    >
                      <Download className="h-3.5 w-3.5" /> Receipt PDF
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1ECEFA]">
            <TrendingUp className="h-4 w-4" /> Conversion Events
          </h2>

          {conversionEvents.length === 0 ? (
            <p className="text-sm text-slate-400">No conversion events yet.</p>
          ) : (
            <ul className="space-y-2">
              {conversionEvents.map((event) => (
                <li key={event.key} className="rounded-xl border border-white/10 bg-[#0d151d] p-3 text-sm text-slate-300">
                  <p className="font-semibold text-white">{event.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateLong(event.date)}</p>
                  {event.detail ? <p className="mt-1 text-xs text-slate-500">{event.detail}</p> : null}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 rounded-lg border border-[#1ECEFA]/20 bg-[#1ECEFA]/5 p-3 text-xs text-slate-300">
            <p className="flex items-center gap-2">
              <CalendarClock className="h-3.5 w-3.5 text-[#1ECEFA]" />
              Example event format: Upgraded from Free on March 1, 2026.
            </p>
          </div>
        </section>
      </div>
    </FeaturePage>
  );
}
