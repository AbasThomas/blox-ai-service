'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Plus,
  ArrowUpRight,
  Clock3,
  CreditCard,
  Globe,
  Activity,
  History,
  ShieldCheck,
} from '@/components/ui/icons';

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
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getNextBillingDate(subscription: SubscriptionSummary | null) {
  if (!subscription) return null;
  return subscription.periodEndAt ?? subscription.currentPeriodEnd ?? null;
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

export default function DashboardPage() {
  const router = useRouter();
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

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const sortedByUpdated = useMemo(
    () => [...assets].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [assets],
  );

  const stats = useMemo(() => {
    const portfolios = assets.filter((a) => a.type === AssetType.PORTFOLIO).length;
    const resumes = assets.filter((a) => a.type === AssetType.RESUME).length;
    const coverLetters = assets.filter((a) => a.type === AssetType.COVER_LETTER).length;
    return { total: assets.length, portfolios, resumes, coverLetters };
  }, [assets]);

  const paymentStatus = subscription?.status ?? 'FREE';
  const paymentTier = subscription?.tier ?? user.tier;
  const nextBillingDate = getNextBillingDate(subscription);

  const statItems = [
    { label: 'Total', value: stats.total, icon: LayoutDashboard, accent: 'bg-[#1ECEFA]' },
    { label: 'Portfolios', value: stats.portfolios, icon: BriefcaseBusiness, accent: 'bg-violet-500' },
    { label: 'Resumes', value: stats.resumes, icon: FileText, accent: 'bg-emerald-500' },
    { label: 'Letters', value: stats.coverLetters, icon: Mail, accent: 'bg-amber-500' },
  ];

  return (
    <FeaturePage
      title={`Welcome back, ${user.name.split(' ')[0]}`}
      description="Here's what's happening across your assets."
    >
      <div className="space-y-8">

        {/* Stat row */}
        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4 bg-[#1B2131] border border-[#1B2131] rounded-md overflow-hidden">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="relative bg-[#0B0E14] px-5 py-4">
                <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${item.accent}`} />
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] text-[#4E5C6E] uppercase tracking-wide">{item.label}</p>
                  <Icon size={14} className="text-[#2E3847]" />
                </div>
                <p className="mt-2 text-3xl font-bold text-white tabular-nums">{item.value}</p>
              </div>
            );
          })}
        </div>

        {/* Portfolios */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-white">Recent Portfolios</h2>
            <Link href="/portfolios" className="text-[12px] text-[#4E5C6E] hover:text-[#1ECEFA] transition-colors">
              All portfolios →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-video animate-pulse rounded-md bg-[#0B0E14] border border-[#1B2131]" />
              ))}
            </div>
          ) : assets.filter((a) => a.type === AssetType.PORTFOLIO).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assets
                .filter((a) => a.type === AssetType.PORTFOLIO)
                .slice(0, 3)
                .map((portfolio) => {
                  const isLive = !!portfolio.publishedUrl;
                  return (
                    <button
                      key={portfolio.id}
                      type="button"
                      onClick={() => router.push(`/portfolios/${portfolio.id}`)}
                      className="group relative w-full overflow-hidden rounded-md border border-[#1B2131] bg-[#0B0E14] hover:border-[#2A3A50] transition-colors focus:outline-none"
                    >
                      <div className="relative aspect-video overflow-hidden bg-[#080A0E]">
                        <div className="absolute top-0 left-0 right-0 z-10 flex h-7 items-center gap-1.5 border-b border-[#1B2131] bg-[#080A0E] px-3">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500/50" />
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500/50" />
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/50" />
                          <div className="ml-2 h-3 w-24 rounded-sm bg-[#1B2131] text-[8px] text-[#4E5C6E] flex items-center px-1.5">
                            {isLive && portfolio.publishedUrl
                              ? portfolio.publishedUrl.replace('https://', '')
                              : 'draft · not published'}
                          </div>
                        </div>

                        {isLive && portfolio.publishedUrl ? (
                          <div className="absolute inset-0 top-7 overflow-hidden">
                            <iframe
                              src={portfolio.publishedUrl}
                              title={`Preview of ${portfolio.title}`}
                              loading="lazy"
                              sandbox="allow-scripts allow-same-origin"
                              tabIndex={-1}
                              aria-hidden="true"
                              className="absolute left-0 top-0 origin-top-left border-0 pointer-events-none"
                              style={{ width: 1280, height: 800, transform: 'scale(0.305)', transformOrigin: 'top left' }}
                            />
                          </div>
                        ) : (
                          <div className="absolute inset-0 top-7 flex flex-col items-center justify-center gap-2 bg-[#080A0E]">
                            <p className="text-[11px] font-medium text-[#2E3847]">{portfolio.title}</p>
                            <p className="text-[10px] text-[#1B2131]">Draft — not published</p>
                          </div>
                        )}

                        <div className="absolute top-9 right-3 z-20">
                          <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                            isLive ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-[#1B2131] bg-[#080A0E] text-[#4E5C6E]'
                          }`}>
                            <span className={`h-1 w-1 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-[#2E3847]'}`} />
                            {isLive ? 'Live' : 'Draft'}
                          </span>
                        </div>

                        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <span className="rounded border border-[#2A3A50] bg-[#0B0E14] px-3 py-1.5 text-[11px] font-medium text-white">
                            Open
                          </span>
                        </div>
                      </div>

                      <div className="px-3 py-2.5 border-t border-[#1B2131] text-left">
                        <h3 className="text-[13px] font-medium text-[#8899AA] truncate group-hover:text-white transition-colors">
                          {portfolio.title}
                        </h3>
                      </div>
                    </button>
                  );
                })}
            </div>
          ) : (
            <div className="flex h-44 flex-col items-center justify-center gap-4 rounded-md border border-dashed border-[#1B2131]">
              <Globe size={22} className="text-[#2E3847]" />
              <div className="text-center">
                <p className="text-[13px] font-medium text-[#8899AA]">No portfolios yet</p>
                <p className="mt-1 text-[12px] text-[#4E5C6E]">Create your first to get started</p>
              </div>
              <Link
                href="/portfolios/new"
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded bg-[#1ECEFA] text-[#060810] text-[12px] font-bold hover:bg-[#3DD5FF] transition-colors"
              >
                <Plus size={13} strokeWidth={3} /> New Portfolio
              </Link>
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Recent Activity */}
          <section className="lg:col-span-8">
            <div className="flex flex-col rounded-md border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#1B2131] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-[#4E5C6E]" />
                  <h2 className="text-[13px] font-semibold text-white">Recent Activity</h2>
                </div>
                <Link href="/portfolios" className="text-[11px] text-[#4E5C6E] hover:text-[#1ECEFA] transition-colors flex items-center gap-1">
                  View all <ArrowUpRight size={11} />
                </Link>
              </div>

              <div className="p-2">
                {loading ? (
                  <div className="space-y-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-14 animate-pulse rounded bg-[#0d1018]" />
                    ))}
                  </div>
                ) : assets.length > 0 ? (
                  <div>
                    {sortedByUpdated.slice(0, 6).map((asset) => (
                      <div
                        key={asset.id}
                        className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded hover:bg-[#0d1018] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            asset.type === AssetType.PORTFOLIO ? 'bg-violet-500' :
                            asset.type === AssetType.RESUME ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-[#8899AA] group-hover:text-white transition-colors">
                              {asset.title}
                            </p>
                            <p className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#3A4452]">
                              <span>{asset.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1"><Clock3 size={10} /> {formatRelativeTime(asset.updatedAt)}</span>
                            </p>
                          </div>
                        </div>
                        <Link
                          href={
                            asset.type === AssetType.PORTFOLIO ? `/portfolios/${asset.id}/edit`
                            : asset.type === AssetType.RESUME ? `/resumes/${asset.id}/edit`
                            : `/cover-letters/${asset.id}/edit`
                          }
                          className="opacity-0 group-hover:opacity-100 flex items-center h-7 px-2.5 rounded border border-[#1B2131] text-[11px] text-[#7A8DA0] hover:text-white transition-all"
                        >
                          Edit
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center gap-3">
                    <FileText size={20} className="text-[#2E3847]" />
                    <p className="text-[13px] text-[#4E5C6E]">No assets yet</p>
                    <Link
                      href="/portfolios/new"
                      className="inline-flex items-center gap-1.5 h-8 px-4 rounded border border-[#1B2131] text-[12px] text-[#7A8DA0] hover:text-white transition-colors"
                    >
                      Create your first
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Right column */}
          <aside className="lg:col-span-4 space-y-4">
            {/* Quick Actions */}
            <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[#1B2131] px-4 py-3">
                <h2 className="text-[13px] font-semibold text-white">Quick Actions</h2>
              </div>
              <div className="p-2">
                {[
                  { href: '/resumes/new', label: 'New Resume', hint: 'ATS-friendly', dot: 'bg-emerald-500' },
                  { href: '/portfolios/new', label: 'New Portfolio', hint: 'Publish anywhere', dot: 'bg-violet-500' },
                  { href: '/cover-letters/new', label: 'New Cover Letter', hint: 'Tailored letter', dot: 'bg-amber-500' },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded hover:bg-[#0d1018] transition-colors"
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${action.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#8899AA] group-hover:text-white transition-colors">{action.label}</p>
                      <p className="text-[11px] text-[#3A4452]">{action.hint}</p>
                    </div>
                    <ArrowUpRight size={13} className="text-[#2E3847] group-hover:text-[#4E5C6E] transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Subscription */}
            <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#1B2131] px-4 py-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={14} className="text-[#4E5C6E]" />
                  <h2 className="text-[13px] font-semibold text-white">Subscription</h2>
                </div>
                <ShieldCheck size={13} className="text-[#1ECEFA]" />
              </div>

              <div className="px-4 py-4 space-y-3">
                <div>
                  <p className="font-mono text-[11px] text-[#4E5C6E] uppercase">Plan</p>
                  <p className="mt-1 text-lg font-bold text-white">{paymentTier}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded border border-[#1B2131] bg-[#0d1018] px-3 py-2">
                    <p className="font-mono text-[10px] text-[#3A4452] uppercase">Status</p>
                    <p className="mt-0.5 text-[12px] font-semibold text-white">{paymentStatus}</p>
                  </div>
                  <div className="rounded border border-[#1B2131] bg-[#0d1018] px-3 py-2">
                    <div className="flex items-center gap-1">
                      <History size={10} className="text-[#3A4452]" />
                      <p className="font-mono text-[10px] text-[#3A4452] uppercase">Next Bill</p>
                    </div>
                    <p className="mt-0.5 text-[12px] font-semibold text-white truncate">
                      {nextBillingDate ? formatDate(nextBillingDate) : 'N/A'}
                    </p>
                  </div>
                </div>

                <Link
                  href="/pricing"
                  className="flex w-full items-center justify-center gap-1.5 h-8 rounded border border-[#1B2131] text-[12px] font-medium text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] transition-colors"
                >
                  Manage Plan <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </FeaturePage>
  );
}
