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
      title="System Overview"
      description="Real-time performance metrics and professional asset synchronization."
      headerIcon={<LayoutDashboard className="h-6 w-6" />}
    >
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Sharp Command Center Hero */}
        <section className="relative overflow-hidden rounded-[2rem] border-2 border-white/10 bg-[#0C0F13] p-12">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
            <div className="space-y-6 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#1ECEFA]/30 bg-[#1ECEFA]/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#1ECEFA]">
                <ShieldCheck className="h-3.5 w-3.5" /> Identity Synchronized
              </div>
              <h2 className="text-6xl font-black text-white tracking-tighter uppercase leading-[0.9]">
                System <span className="text-[#1ECEFA]">Online</span>,<br />
                {user.name.split(' ')[0]}
              </h2>
              <p className="text-slate-400 text-xl leading-relaxed font-medium border-l-2 border-white/10 pl-6">
                Your professional identity is distributed across <span className="text-white font-bold">{stats.total} nodes</span>. 
                Network stability is verified at <span className="text-white font-bold">98.4%</span>.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/portfolios/new"
                  className="flex items-center gap-3 rounded-xl bg-[#1ECEFA] px-8 py-4 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-white active:scale-95"
                >
                  <PlusCircle className="h-4 w-4" /> New Archive
                </Link>
                <Link
                  href="/coach"
                  className="flex items-center gap-3 rounded-xl border-2 border-white/10 bg-transparent px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white hover:text-black active:scale-95"
                >
                  <TrendingUp className="h-4 w-4" /> Trajectory
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full lg:w-72">
              <div className="rounded-2xl border-2 border-white/10 bg-white/5 p-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Total Outreach</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-black text-white tracking-tighter">{stats.recentViews}</p>
                  <span className="text-xs font-black text-[#1ECEFA]">UNIT</span>
                </div>
              </div>
              <div className="rounded-2xl border-2 border-[#1ECEFA]/20 bg-[#1ECEFA]/5 p-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1ECEFA]/60 mb-2">Health Index</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-black text-[#1ECEFA] tracking-tighter">98</p>
                  <span className="text-xs font-black text-[#1ECEFA]/60">%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* High-Contrast Metrics Grid */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Nodes', value: stats.total, icon: LayoutDashboard, color: 'text-white' },
            { label: 'Portfolios', value: stats.portfolios, icon: BriefcaseBusiness, color: 'text-[#1ECEFA]' },
            { label: 'Resumes', value: stats.resumes, icon: FileText, color: 'text-white' },
            { label: 'Transmissions', value: stats.coverLetters, icon: Mail, color: 'text-white' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="group relative rounded-2xl border-2 border-white/5 bg-white/5 p-6 transition-all hover:border-white/20"
              >
                <div className="mb-8 flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-black/60 border border-white/10 ${item.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-slate-700 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-4xl font-black text-white tracking-tighter">{item.value.toString().padStart(2, '0')}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">{item.label}</p>
                </div>
              </div>
            );
          })}
        </section>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Detailed Node Status */}
          <section className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between border-b-2 border-white/5 pb-4">
              <h2 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-white">
                <Activity className="h-4 w-4 text-[#1ECEFA]" /> Active Archive Status
              </h2>
              <Link href="/portfolios" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#1ECEFA] transition-colors">
                Registry Access
              </Link>
            </div>

            <div className="grid gap-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-white/5 border border-white/5" />
                ))
              ) : assets.length > 0 ? (
                sortedByUpdated.slice(0, 5).map((asset) => (
                  <div
                    key={asset.id}
                    className="group flex items-center justify-between rounded-xl border-2 border-white/5 bg-black/40 p-5 transition-all hover:border-[#1ECEFA]/40 hover:bg-black/60"
                  >
                    <div className="flex items-center gap-6 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-500 group-hover:text-[#1ECEFA] transition-colors">
                        {asset.type === AssetType.PORTFOLIO ? <Globe className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black text-white tracking-tight uppercase group-hover:text-[#1ECEFA] transition-colors">{asset.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 py-0.5 border border-white/10 rounded">
                            {asset.type.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                            Sync: {formatDate(asset.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {asset.publishedUrl && (
                        <Link 
                          href={asset.publishedUrl} 
                          target="_blank" 
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-500 hover:bg-white hover:text-black transition-all"
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
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1ECEFA]/10 border border-[#1ECEFA]/20 text-[#1ECEFA] hover:bg-[#1ECEFA] hover:text-black transition-all"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-white/10 p-20 text-center">
                  <p className="text-xs font-black text-slate-600 uppercase tracking-[0.3em]">Registry Empty</p>
                  <Link href="/portfolios/new" className="mt-6 inline-flex rounded-lg bg-white px-8 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:bg-[#1ECEFA] transition-all">
                    Initialize Registry
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Operation Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="rounded-2xl border-2 border-white/10 bg-white/5 p-8 space-y-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Fast Actions</h2>
              <div className="grid gap-2">
                {[
                  { href: '/resumes/new', label: 'New Resume', icon: FileText },
                  { href: '/portfolios/new', label: 'New Portfolio', icon: Globe },
                  { href: '/cover-letters/new', label: 'New Transmission', icon: Mail },
                  { href: '/coach', label: 'Career Protocol', icon: Zap },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group flex items-center justify-between rounded-xl border border-white/5 bg-black/40 px-5 py-4 transition-all hover:border-white/20 hover:bg-black/60"
                    >
                      <div className="flex items-center gap-4">
                        <Icon className="h-4 w-4 text-slate-500 group-hover:text-[#1ECEFA] transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">{action.label}</span>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-700 group-hover:text-[#1ECEFA] transition-all" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-[#1ECEFA]/20 bg-[#1ECEFA]/5 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1ECEFA]/60">Account Tier</p>
                <ShieldCheck className="h-4 w-4 text-[#1ECEFA]" />
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-black text-white tracking-tighter uppercase">{paymentTier}</p>
                <p className="text-[9px] font-black text-[#1ECEFA]/60 uppercase tracking-widest flex items-center gap-2">
                  Status: {paymentStatus} <span className="h-1 w-1 rounded-full bg-[#1ECEFA]" />
                </p>
              </div>
              <div className="pt-6 border-t border-[#1ECEFA]/10 space-y-3">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                  <span className="text-slate-500">Next Sync</span>
                  <span className="text-white">{nextBillingDate ? formatDate(nextBillingDate) : 'MANUAL'}</span>
                </div>
              </div>
              <Link
                href="/pricing"
                className="flex items-center justify-center rounded-xl bg-white px-6 py-4 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-[#1ECEFA]"
              >
                Elevate Access
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </FeaturePage>
  );
}
