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
  PlusCircle,
  ArrowUpRight,
  Clock3,
  CreditCard,
  Zap,
  Globe,
  BarChart3,
  Activity,
  History,
  ShieldCheck,
  X,
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

  return (
    <FeaturePage
      title="Overview"
      description={`Good day, welcome back, ${user.name.split(' ')[0]}!`}
      headerIcon={<LayoutDashboard className="h-5 w-5" />}
    >
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">

        {/* Stats Grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Assets', value: stats.total, icon: LayoutDashboard, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'hover:border-blue-500/20' },
            { label: 'Portfolios', value: stats.portfolios, icon: BriefcaseBusiness, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'hover:border-purple-500/20' },
            { label: 'Resumes', value: stats.resumes, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'hover:border-emerald-500/20' },
            { label: 'Cover Letters', value: stats.coverLetters, icon: Mail, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'hover:border-amber-500/20' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-0.5 ${item.border} hover:bg-white/[0.04]`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg} ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">{item.label}</p>
                    <p className="text-2xl font-bold text-white">{item.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Portfolios section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Recent Portfolios</h2>
              <p className="text-xs text-slate-500 mt-0.5">Click a card to manage</p>
            </div>
            <Link
              href="/portfolios"
              className="text-xs font-medium text-slate-400 hover:text-[#1ECEFA] transition-colors"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-video animate-pulse rounded-2xl bg-white/5 border border-white/5" />
              ))}
            </div>
          ) : assets.filter((a) => a.type === AssetType.PORTFOLIO).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      className="group relative w-full overflow-hidden rounded-2xl border border-white/5 bg-[#0C0F13] transition-all duration-300 hover:border-white/15 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    >
                      {/* Preview area */}
                      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#1ECEFA]/6 via-[#0C0F13] to-purple-500/8">
                        <div className="absolute inset-0 flex flex-col">
                          <div className="h-7 border-b border-white/5 bg-white/[0.03] flex items-center gap-1.5 px-3 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500/40" />
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500/40" />
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/40" />
                            <div className="ml-2 h-3 w-28 rounded-full bg-white/5" />
                          </div>
                          <div className="flex-1 p-4 space-y-2 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                            <div className="h-3 w-3/4 rounded-full bg-white/20" />
                            <div className="h-2 w-1/2 rounded-full bg-white/10" />
                            <div className="mt-2 h-2 w-full rounded-full bg-white/10" />
                            <div className="h-2 w-5/6 rounded-full bg-white/10" />
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="absolute top-9 right-3">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm ${
                            isLive
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                              : 'border-slate-600/20 bg-slate-600/10 text-slate-500'
                          }`}>
                            <span className={`h-1 w-1 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                            {isLive ? 'Live' : 'Draft'}
                          </span>
                        </div>

                        {/* Hover cue */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30 backdrop-blur-[1px]">
                          <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-medium text-white">
                            Manage
                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between gap-2 text-left">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                            {portfolio.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatRelativeTime(portfolio.updatedAt)}
                          </p>
                        </div>
                        <Globe className="h-3.5 w-3.5 shrink-0 text-slate-600 group-hover:text-[#1ECEFA] transition-colors" />
                      </div>
                    </button>
                  );
                })}
            </div>
          ) : (
            <div className="flex h-52 flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
                <Globe className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-300">No portfolios yet</p>
                <p className="mt-1 text-xs text-slate-500">Create your first portfolio to get started.</p>
              </div>
              <Link
                href="/portfolios/new"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-[#0C0F13] hover:bg-[#1ECEFA] hover:scale-105 transition-all"
              >
                <PlusCircle className="h-4 w-4" /> Create Portfolio
              </Link>
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Recent Activity */}
          <section className="lg:col-span-8">
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-white/5 p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                    <Activity className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
                </div>
                <Link
                  href="/portfolios"
                  className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  View All <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="flex-1 p-3">
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
                    ))}
                  </div>
                ) : assets.length > 0 ? (
                  <div className="space-y-1">
                    {sortedByUpdated.slice(0, 5).map((asset) => (
                      <div
                        key={asset.id}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-transparent p-3 transition-all hover:border-white/5 hover:bg-white/[0.04]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/40 border border-white/5 ${
                              asset.type === AssetType.PORTFOLIO
                                ? 'text-blue-400'
                                : asset.type === AssetType.RESUME
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {asset.type === AssetType.PORTFOLIO ? (
                              <Globe className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                              {asset.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-medium text-slate-500">
                                {asset.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                              </span>
                              <span className="text-[10px] text-slate-600">·</span>
                              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                <Clock3 className="h-3 w-3" /> {formatDate(asset.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {asset.publishedUrl && (
                            <Link
                              href={asset.publishedUrl}
                              target="_blank"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-blue-500 hover:text-white transition-all"
                            >
                              <Globe className="h-3.5 w-3.5" />
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
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white hover:text-black transition-all"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-56 flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-300">No assets created yet</p>
                      <p className="mt-1 text-xs text-slate-500">Start building your professional presence</p>
                    </div>
                    <Link
                      href="/portfolios/new"
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-blue-400 hover:text-white transition-all"
                    >
                      <PlusCircle className="h-4 w-4" /> Create First Asset
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Quick Actions & Subscription */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Zap className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-semibold text-white">Quick Actions</h2>
              </div>
              <div className="grid gap-2.5">
                {[
                  { href: '/resumes/new', label: 'Create Resume', desc: 'ATS-friendly resume', icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                  { href: '/portfolios/new', label: 'Create Portfolio', desc: 'Stunning portfolio website', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                  { href: '/cover-letters/new', label: 'Write Cover Letter', desc: 'Tailored cover letter', icon: Mail, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                  { href: '/coach', label: 'AI Career Coach', desc: 'Personalized guidance', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 p-3 transition-all hover:bg-white/10 hover:border-white/10"
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.bg} ${action.color} transition-transform group-hover:scale-110 duration-200`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">
                          {action.label}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{action.desc}</p>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-600 opacity-0 group-hover:opacity-100 group-hover:text-white transition-all" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent p-5">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold text-white">Subscription</p>
                  </div>
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                </div>

                <div className="mb-5">
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-white">{paymentTier}</p>
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                      {paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-black/40 p-3 border border-white/5">
                    <div className="flex items-center gap-2">
                      <History className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-300">Next Billing</span>
                    </div>
                    <span className="text-xs font-semibold text-white">
                      {nextBillingDate ? formatDate(nextBillingDate) : 'N/A'}
                    </span>
                  </div>

                  <Link
                    href="/pricing"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-blue-400 hover:text-white transition-all"
                  >
                    Manage Plan <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

    </FeaturePage>
  );
}
