'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { billingApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import { Receipt, CreditCard, CalendarClock, TrendingUp, Download, ArrowUpRight } from '@/components/ui/icons';

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
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function normalizeAmountMinor(amountMinor?: number, amount?: number) {
  if (typeof amountMinor === 'number') return amountMinor;
  if (typeof amount === 'number') return Math.round(amount * 100);
  return 0;
}

function formatMoney(amountMinor: number, currency = 'NGN') {
  return `${currency.toUpperCase()} ${(amountMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
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

  useEffect(() => { loadBilling(); }, [loadBilling]);

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
        detail: `${formatMoney(amountMinor, invoice.currency ?? subscription?.currency ?? 'NGN')} · Tx: ${invoice.providerEventId ?? subscription?.providerReference ?? 'N/A'}`,
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
    receiptWindow.document.write(`<html><head><title>Receipt ${escapeHtml(receiptNumber)}</title><style>body{font-family:system-ui,sans-serif;color:#111;padding:24px;}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #ddd;}</style></head><body><h1>Receipt</h1><p>Generated on ${escapeHtml(new Date().toLocaleString())}</p><div class="row"><span>Invoice</span><b>${escapeHtml(receiptNumber)}</b></div><div class="row"><span>Date</span><b>${escapeHtml(formatDateLong(invoice.createdAt))}</b></div><div class="row"><span>Amount</span><b>${escapeHtml(formatMoney(amountMinor, currency))}</b></div><div class="row"><span>Item</span><b>${escapeHtml(itemLabel)}</b></div><div class="row"><span>Transaction ID</span><b>${escapeHtml(transactionId)}</b></div><p style="margin-top:20px;color:#555;">Payment processor: Paystack</p></body></html>`);
    receiptWindow.document.close(); receiptWindow.focus(); receiptWindow.print();
  }, [subscription, user.tier]);

  return (
    <FeaturePage
      title="Billing & Invoices"
      description="Track subscription status, conversion history, and invoice receipts."
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-300">
            {error}
          </div>
        )}

        {/* Stat row */}
        <div className="grid gap-px md:grid-cols-3 bg-[#1B2131] border border-[#1B2131] rounded-md overflow-hidden">
          {[
            { label: 'Current Plan', value: subscription?.tier ?? user.tier, accent: 'bg-[#1ECEFA]' },
            { label: 'Status', value: subscription?.status ?? 'FREE', accent: 'bg-[#4E5C6E]' },
            { label: 'Next Billing', value: formatDate(nextBilling), accent: 'bg-amber-500' },
          ].map((s) => (
            <div key={s.label} className="relative bg-[#0B0E14] px-5 py-4">
              <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${s.accent}`} />
              <p className="font-mono text-[11px] text-[#4E5C6E] uppercase tracking-wide">{s.label}</p>
              <p className="mt-1.5 text-xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Subscription details */}
        <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#1B2131] px-4 py-3">
            <CreditCard size={14} className="text-[#4E5C6E]" />
            <h2 className="text-[13px] font-semibold text-white">Subscription & Payment</h2>
          </div>
          <div className="px-4 py-4">
            {loading ? (
              <div className="h-20 animate-pulse rounded bg-[#0d1018]" />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
                <div className="space-y-1.5">
                  <p className="text-[#4E5C6E]">Plan <span className="ml-2 text-white font-medium">{subscription?.tier ?? user.tier}</span></p>
                  <p className="text-[#4E5C6E]">Cycle <span className="ml-2 text-white font-medium">{subscription?.cycle ?? 'N/A'}</span></p>
                  <p className="text-[#4E5C6E]">Next billing <span className="ml-2 text-white font-medium">{formatDateLong(nextBilling)}</span></p>
                  <p className="text-[#4E5C6E]">Processor <span className="ml-2 text-white font-medium">Paystack</span></p>
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded bg-[#1ECEFA] text-[#060810] text-[12px] font-bold hover:bg-[#3DD5FF] transition-colors"
              >
                Upgrade / Downgrade <ArrowUpRight size={12} />
              </Link>
              <Link
                href="/checkout"
                className="inline-flex items-center h-8 px-4 rounded border border-[#1B2131] text-[#7A8DA0] text-[12px] font-medium hover:text-white hover:border-[#2A3A50] transition-colors"
              >
                Update Payment Method
              </Link>
            </div>
          </div>
        </div>

        {/* Invoices */}
        <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#1B2131] px-4 py-3">
            <Receipt size={14} className="text-[#4E5C6E]" />
            <h2 className="text-[13px] font-semibold text-white">Invoice History</h2>
          </div>

          {loading ? (
            <div className="p-4">
              <div className="h-16 animate-pulse rounded bg-[#0d1018]" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-[#4E5C6E]">No invoices yet.</div>
          ) : (
            <div>
              {invoices.map((invoice) => {
                const amountMinor = normalizeAmountMinor(invoice.amountMinor, invoice.amount);
                return (
                  <div
                    key={invoice.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-[#1B2131] last:border-b-0 hover:bg-[#0d1018] transition-colors"
                  >
                    <div>
                      <p className="text-[13px] font-medium text-white">#{invoice.id.slice(0, 12)}</p>
                      <p className="mt-0.5 text-[11px] text-[#4E5C6E]">
                        {formatDate(invoice.createdAt)} · {formatMoney(amountMinor, invoice.currency ?? subscription?.currency ?? 'NGN')}
                      </p>
                      <p className="text-[11px] text-[#3A4452] font-mono">
                        Tx: {invoice.providerEventId ?? subscription?.providerReference ?? 'N/A'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReceipt(invoice)}
                      className="inline-flex items-center gap-1.5 h-7 px-3 rounded border border-[#1B2131] text-[11px] text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] transition-colors"
                    >
                      <Download size={11} /> Receipt
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Conversion events */}
        <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#1B2131] px-4 py-3">
            <TrendingUp size={14} className="text-[#4E5C6E]" />
            <h2 className="text-[13px] font-semibold text-white">Conversion Events</h2>
          </div>

          {conversionEvents.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-[#4E5C6E]">No conversion events yet.</div>
          ) : (
            <div>
              {conversionEvents.map((event) => (
                <div
                  key={event.key}
                  className="flex items-start gap-3 px-4 py-3 border-b border-[#1B2131] last:border-b-0"
                >
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1ECEFA]" />
                  <div>
                    <p className="text-[13px] font-medium text-white">{event.label}</p>
                    <p className="mt-0.5 text-[11px] text-[#4E5C6E]">{formatDateLong(event.date)}</p>
                    {event.detail && <p className="text-[11px] text-[#3A4452]">{event.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-[#1B2131] px-4 py-3">
            <CalendarClock size={12} className="text-[#3A4452]" />
            <p className="text-[11px] text-[#3A4452]">Events show plan upgrades and payment records.</p>
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
