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
  Zap,
  Globe,
  BarChart3,
  Activity,
  History,
  ShieldCheck,
  TrendingUp,
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
      recentViews: viewsWithData.length > 0 ? recentViews : 0,
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
      title="Overview"
      description={`Good day, welcome back, ${user.name.split(' ')[0]}!`}
      headerIcon={<LayoutDashboard className="h-5 w-5" />}
    >
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
        {/* Professional Stats Grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Assets', value: stats.total, icon: LayoutDashboard, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'hover:border-blue-500/30' },
            { label: 'Portfolios', value: stats.portfolios, icon: BriefcaseBusiness, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'hover:border-purple-500/30' },
            { label: 'Resumes', value: stats.resumes, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'hover:border-emerald-500/30' },
            { label: 'Cover Letters', value: stats.coverLetters, icon: Mail, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'hover:border-amber-500/30' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`group relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/5 bg-white/[0.02] p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 ${item.border} hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-black/50`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl group-hover:from-white/10 transition-all duration-500" />
                <div className="mb-6 flex items-center justify-between">
                  <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl ${item.bg} ${item.color} shadow-inner`}>
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-slate-600 transition-colors duration-300 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-white tracking-tight">{item.value}</p>
                  <p className="mt-2 text-[10px] md:text-xs font-semibold uppercase tracking-widest text-slate-400">{item.label}</p>
                </div>
              </div>
            );
          })}
        </section>

        <div className="grid gap-6 md:gap-8 lg:grid-cols-12">
          {/* Recent Activity */}
          <section className="lg:col-span-8">
            <div className="flex h-full flex-col overflow-hidden rounded-2xl md:rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/5 p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                    <Activity className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-white tracking-wide">Recent Activity</h2>
                </div>
                <Link href="/portfolios" className="group flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition-colors">
                  View All <ArrowUpRight className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>

              <div className="flex-1 p-2 md:p-3">
                {loading ? (
                  <div className="space-y-2 p-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-16 md:h-20 animate-pulse rounded-2xl bg-white/5" />
                    ))}
                  </div>
                ) : assets.length > 0 ? (
                  <div className="space-y-2">
                    {sortedByUpdated.slice(0, 5).map((asset) => (
                      <div
                        key={asset.id}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 rounded-xl md:rounded-2xl border border-transparent p-3 md:p-4 transition-all duration-300 hover:border-white/5 hover:bg-white/[0.04]"
                      >
                        <div className="flex items-center gap-3 md:gap-4 min-w-0">
                          <div className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-lg md:rounded-xl bg-black/40 border border-white/5 transition-colors duration-300 group-hover:bg-white/10 ${
                            asset.type === AssetType.PORTFOLIO ? 'text-blue-400' : 
                            asset.type === AssetType.RESUME ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {asset.type === AssetType.PORTFOLIO ? <Globe className="h-5 w-5 md:h-6 md:w-6" /> : <FileText className="h-5 w-5 md:h-6 md:w-6" />}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm md:text-base font-semibold text-slate-200 group-hover:text-white transition-colors">{asset.title}</h3>
                            <div className="flex items-center gap-2 md:gap-3 mt-1">
                              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] md:text-[10px] font-medium text-slate-300">
                                {asset.type.replace('_', ' ')}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] md:text-[11px] font-medium text-slate-500">
                                <Clock3 className="h-3 w-3" /> {formatDate(asset.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 self-end sm:self-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                          {asset.publishedUrl && (
                            <Link 
                              href={asset.publishedUrl} 
                              target="_blank" 
                              className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl bg-white/5 text-slate-400 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                              title="View Live"
                            >
                              <Globe className="h-4 w-4" />
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
                            className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl bg-white/5 text-slate-400 hover:bg-white hover:text-black transition-all shadow-sm"
                            title="Edit"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-[300px] flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-slate-400">
                      <FileText className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-300">No assets created yet</p>
                      <p className="mt-1 text-xs text-slate-500">Start building your professional presence</p>
                    </div>
                    <Link href="/portfolios/new" className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 md:px-6 md:py-3 text-xs font-bold text-black hover:bg-blue-400 hover:text-white transition-all">
                      <PlusCircle className="h-4 w-4" /> Create First Asset
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Quick Actions & Subscription Sidebar */}
          <aside className="lg:col-span-4 space-y-6 md:space-y-8">
            <div className="overflow-hidden rounded-2xl md:rounded-3xl border border-white/5 bg-white/[0.02] p-5 md:p-6 backdrop-blur-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Zap className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-semibold text-white tracking-wide">Quick Actions</h2>
              </div>
              <div className="grid gap-3">
                {[
                  { href: '/resumes/new', label: 'Create Resume', desc: 'Build an ATS-friendly resume', icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                  { href: '/portfolios/new', label: 'Create Portfolio', desc: 'Design a stunning website', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                  { href: '/cover-letters/new', label: 'Write Cover Letter', desc: 'Craft a tailored letter', icon: Mail, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                  { href: '/coach', label: 'AI Career Coach', desc: 'Get personalized guidance', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group flex items-center gap-3 md:gap-4 rounded-xl md:rounded-2xl border border-white/5 bg-black/20 p-3 md:p-4 transition-all duration-300 hover:bg-white/10 hover:border-white/10"
                    >
                      <div className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-lg md:rounded-xl ${action.bg} ${action.color} transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{action.label}</p>
                        <p className="truncate text-xs text-slate-500">{action.desc}</p>
                      </div>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-slate-400 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-white/10 group-hover:text-white">
                        <PlusCircle className="h-4 w-4" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent p-5 md:p-6">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold text-white tracking-wide">Subscription</p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-blue-400" />
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl md:text-4xl font-bold text-white tracking-tight uppercase">{paymentTier}</p>
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[9px] md:text-[10px] font-bold text-blue-400 border border-blue-500/20">
                      {paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-black/40 p-3 md:p-4 border border-white/5">
                    <div className="flex items-center gap-3">
                      <History className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-300">Next Billing</span>
                    </div>
                    <span className="text-xs font-bold text-white tracking-wide">
                      {nextBillingDate ? formatDate(nextBillingDate) : 'N/A'}
                    </span>
                  </div>
                  
                  <Link
                    href="/pricing"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 md:px-6 md:py-4 text-xs font-bold text-black transition-all hover:bg-blue-400 hover:text-white active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                  >
                    Manage Plan <ArrowUpRight className="h-4 w-4" />
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
