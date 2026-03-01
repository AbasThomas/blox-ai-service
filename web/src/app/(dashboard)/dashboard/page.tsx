'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AssetType } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi, billingApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import {
  LayoutDashboard,
  BriefcaseBusiness,
  FileText,
  Mail,
  Receipt,
  PlusCircle,
  ArrowUpRight,
  Clock3,
  CreditCard,
} from 'lucide-react';

interface DashboardAsset {
  id: string;
  type: AssetType;
  title: string;
  healthScore?: number | null;
  publishedUrl?: string | null;
  views?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface BillingInvoice {
  id: string;
  amountMinor?: number;
  amount?: number;
  currency?: string;
  createdAt: string;
}

interface SubscriptionSummary {
  id: string;
  tier?: string | null;
  status?: string | null;
  cycle?: string | null;
  periodEndAt?: string | null;
  currentPeriodEnd?: string | null;
  invoices?: BillingInvoice[];
}

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString();
}

function getNextBillingDate(subscription: SubscriptionSummary | null) {
  if (!subscription) return null;
  return subscription.periodEndAt ?? subscription.currentPeriodEnd ?? null;
}

export default function DashboardPage() {
  const user = useBloxStore((state) => state.user);
  const [assets, setAssets] = useState<DashboardAsset[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [assetsResult, subscriptionResult] = await Promise.all([
        assetsApi.list(),
        billingApi.getSubscription().catch(() => null),
      ]);

      setAssets(Array.isArray(assetsResult) ? (assetsResult as DashboardAsset[]) : []);
      setSubscription(subscriptionResult as SubscriptionSummary | null);
    } catch {
      setAssets([]);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const sortedByUpdated = useMemo(
    () => [...assets].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [assets],
  );

  const stats = useMemo(() => {
    const portfolios = assets.filter((asset) => asset.type === AssetType.PORTFOLIO).length;
    const resumes = assets.filter((asset) => asset.type === AssetType.RESUME).length;
    const coverLetters = assets.filter((asset) => asset.type === AssetType.COVER_LETTER).length;
    const viewsWithData = assets.filter((asset) => typeof asset.views === 'number');
    const recentViews = viewsWithData.reduce((sum, asset) => sum + (asset.views ?? 0), 0);

    return {
      total: assets.length,
      portfolios,
      resumes,
      coverLetters,
      recentViews: viewsWithData.length > 0 ? recentViews : null,
    };
  }, [assets]);

  const latestPortfolio = useMemo(
    () => sortedByUpdated.find((asset) => asset.type === AssetType.PORTFOLIO) ?? null,
    [sortedByUpdated],
  );
  const latestResume = useMemo(
    () => sortedByUpdated.find((asset) => asset.type === AssetType.RESUME) ?? null,
    [sortedByUpdated],
  );

  const paymentStatus = subscription?.status ?? 'FREE';
  const paymentTier = subscription?.tier ?? user.tier;
  const nextBillingDate = getNextBillingDate(subscription);
  const recentInvoices = (subscription?.invoices ?? []).slice(0, 3);

  return (
    <FeaturePage
      title={`Welcome back, ${user.name}`}
      description="Create faster, track progress, and pick up where you left off — all in one place."
      headerIcon={<LayoutDashboard className="h-6 w-6" />}
    >
      <div className="space-y-10">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d151d] to-[#0b121a] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Overview</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {stats.total > 0 ? `You have ${stats.total} assets` : 'Let’s create your first asset'}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Portfolios {stats.portfolios} • Resumes {stats.resumes} • Cover Letters {stats.coverLetters}
                </p>
              </div>
              <Link
                href="/resumes/new"
                className="inline-flex items-center gap-2 rounded-xl border border-[#1ECEFA]/40 bg-[#1ECEFA]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#1ECEFA] transition-colors hover:bg-[#1ECEFA]/20"
              >
                Start New <PlusCircle className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Recent Views</p>
            <p className="mt-2 text-3xl font-black text-white">{stats.recentViews ?? 'N/A'}</p>
            <p className="mt-1 text-xs text-slate-400">Across your published assets</p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Assets', value: stats.total, icon: LayoutDashboard },
            { label: 'Portfolios', value: stats.portfolios, icon: BriefcaseBusiness },
            { label: 'Resumes', value: stats.resumes, icon: FileText },
            { label: 'Cover Letters', value: stats.coverLetters, icon: Mail },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="group rounded-2xl border border-white/10 bg-[#0d151d] p-4 transition-colors hover:border-[#1ECEFA]/30"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{item.label}</p>
                  <Icon className="h-4 w-4 text-[#1ECEFA]" />
                </div>
                <p className="text-2xl font-black text-white">{item.value}</p>
              </div>
            );
          })}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-black/20 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1ECEFA]">
              <Clock3 className="h-4 w-4" /> Continue Where You Left Off
            </h2>
            {loading ? (
              <div className="space-y-3">
                <div className="h-12 animate-pulse rounded-xl bg-white/5" />
                <div className="h-12 animate-pulse rounded-xl bg-white/5" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-[#0d151d] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Last Edited Portfolio</p>
                  {latestPortfolio ? (
                    <>
                      <p className="mt-2 truncate text-sm font-semibold text-white">{latestPortfolio.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDate(latestPortfolio.updatedAt)}</p>
                      <div className="mt-3 flex items-center gap-4">
                        <Link
                          href={`/portfolios/${latestPortfolio.id}/edit`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#1ECEFA] hover:underline"
                        >
                          Continue editing <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                        {latestPortfolio.publishedUrl && (
                          <Link
                            href={latestPortfolio.publishedUrl}
                            target="_blank"
                            className="text-xs font-semibold text-slate-300 hover:text-white"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">No portfolio activity yet.</p>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0d151d] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Last Edited Resume</p>
                  {latestResume ? (
                    <>
                      <p className="mt-2 truncate text-sm font-semibold text-white">{latestResume.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDate(latestResume.updatedAt)}</p>
                      <div className="mt-3 flex items-center gap-4">
                        <Link
                          href={`/resumes/${latestResume.id}/edit`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#1ECEFA] hover:underline"
                        >
                          Continue editing <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                        {latestResume.publishedUrl && (
                          <Link
                            href={latestResume.publishedUrl}
                            target="_blank"
                            className="text-xs font-semibold text-slate-300 hover:text-white"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">No resume activity yet.</p>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1ECEFA]">
              <PlusCircle className="h-4 w-4" /> Quick Actions
            </h2>
            <div className="grid gap-3">
              {[
                { href: '/resumes/new', label: 'New Resume' },
                { href: '/cover-letters/new', label: 'New Cover Letter' },
                { href: '/portfolios/new', label: 'New Portfolio' },
                { href: '/billing', label: 'View Invoices' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0d151d] px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-[#1ECEFA]/40 hover:text-white"
                >
                  <span>{action.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-[#1ECEFA]" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-black/20 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1ECEFA]">
              <LayoutDashboard className="h-4 w-4" /> Your Recent Assets
            </h2>
            {loading ? (
              <div className="space-y-3">
                <div className="h-12 animate-pulse rounded-xl bg-white/5" />
                <div className="h-12 animate-pulse rounded-xl bg-white/5" />
                <div className="h-12 animate-pulse rounded-xl bg-white/5" />
              </div>
            ) : assets.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {sortedByUpdated.slice(0, 6).map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0d151d] p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider border border-white/10 text-slate-300">
                          {asset.type.replace('_', ' ')}
                        </span>
                        <p className="truncate text-sm font-semibold text-white">{asset.title}</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">Updated {formatDate(asset.updatedAt)}</p>
                    </div>
                    <div className="ml-4 flex shrink-0 items-center gap-3">
                      {asset.publishedUrl && (
                        <Link href={asset.publishedUrl} target="_blank" className="text-xs font-semibold text-slate-300 hover:text-white">
                          View
                        </Link>
                      )}
                      <Link
                        href={
                          asset.type === AssetType.PORTFOLIO
                            ? `/portfolios/${asset.id}/edit`
                            : asset.type === AssetType.RESUME
                            ? `/resumes/${asset.id}/edit`
                            : `/cover-letters/${asset.id}/edit`
                        }
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#1ECEFA] hover:underline"
                      >
                        Edit <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                <p className="text-sm text-slate-400">No assets yet. Use Quick Actions to create your first one.</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1ECEFA]">
              <CreditCard className="h-4 w-4" /> Billing Summary
            </h2>
            <div className="space-y-2 text-sm text-slate-300">
              <p>
                Plan: <span className="font-bold text-white">{paymentTier}</span>
              </p>
              <p>
                Status: <span className="font-bold text-white">{paymentStatus}</span>
              </p>
              <p>
                Next Billing Date:{' '}
                <span className="font-bold text-white">{nextBillingDate ? formatDate(nextBillingDate) : 'N/A'}</span>
              </p>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Recent Invoices</p>
              {recentInvoices.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {recentInvoices.map((inv) => {
                    const amount = typeof inv.amountMinor === 'number'
                      ? (inv.amountMinor / 100).toFixed(2)
                      : typeof inv.amount === 'number'
                      ? inv.amount.toFixed(2)
                      : null;
                    const currency = inv.currency ?? 'USD';
                    return (
                      <li key={inv.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0d151d] px-3 py-2">
                        <span className="text-xs text-slate-300">{inv.id.slice(0, 10)} • {formatDate(inv.createdAt)}</span>
                        <span className="text-xs font-semibold text-white">
                          {amount ? `${currency} ${amount}` : 'N/A'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-slate-400">No invoices yet.</p>
              )}
            </div>
            <Link
              href="/billing"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#1ECEFA]/40 bg-[#1ECEFA]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#1ECEFA] transition-colors hover:bg-[#1ECEFA]/20"
            >
              Open Billing <Receipt className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </FeaturePage>
  );
}
