'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { useBloxStore, Asset } from '@/lib/store/app-store';
import { assetsApi } from '@/lib/api';
import { PlanTier } from '@nextjs-blox/shared-types';
import { HexagonBackground } from '@/components/shared/hexagon-background';
import { LayoutDashboard, Rocket, Zap, Clock, ShieldCheck, Activity, Award, Star, Search, PlusCircle, Bell, ArrowRight } from 'lucide-react';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  PORTFOLIO: <LayoutDashboard className="h-4 w-4" />,
  RESUME: <Search className="h-4 w-4" />,
  COVER_LETTER: <Star className="h-4 w-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  PORTFOLIO: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
  RESUME: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  COVER_LETTER: 'border-[#1ECEFA]/30 text-[#1ECEFA] bg-[#1ECEFA]/10',
};

export default function DashboardPage() {
  const user = useBloxStore((s) => s.user);
  const notifications = useBloxStore((s) => s.notifications);
  const markRead = useBloxStore((s) => s.markNotificationRead);
  const assets = useBloxStore((s) => s.assets);
  const setAssets = useBloxStore((s) => s.setAssets);
  const [loading, setLoading] = useState(true);

  const loadAssets = useCallback(async () => {
    try {
      const data = await assetsApi.list() as Asset[];
      setAssets(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [setAssets]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const published = assets.filter((a) => a.publishedUrl).length;
  const avgHealth = assets.length > 0
    ? Math.round(assets.reduce((sum, a) => sum + (a.healthScore ?? 0), 0) / assets.length)
    : 0;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden" style={{ background: '#0C0F13' }}>
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <HexagonBackground hexagonSize={50} proximity={250} />
      </div>

      <div className="relative z-10">
        <FeaturePage
          title={`COMMAND CENTER: ${user.name.split(' ')[0].toUpperCase()}`}
          description={`Tier Level: ${user.tier}. ${user.tier === PlanTier.FREE ? 'System features restricted. Initiate upgrade sequence.' : 'All premium protocols verified and online.'}`}
          headerIcon={<ShieldCheck className="h-6 w-6" />}
        >
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
            {[
              { label: 'Deployed Assets', value: assets.length, icon: <LayoutDashboard className="h-5 w-5 opacity-50" /> },
              { label: 'Live Environments', value: published, icon: <Rocket className="h-5 w-5 opacity-50" /> },
              { label: 'Core Stability', value: `${avgHealth}%`, icon: <Activity className="h-5 w-5 opacity-50" /> },
              { label: 'Uptime Streak', value: `${user.streak ?? 0} Days`, icon: <Zap className="h-5 w-5 opacity-50 text-yellow-500" /> },
            ].map((stat) => (
              <div key={stat.label} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md transition-all hover:border-[#1ECEFA]/40 hover:bg-[#161B22]/80">
                <div className="absolute right-3 top-3 text-[#1ECEFA] transition-transform group-hover:scale-110">
                  {stat.icon}
                </div>
                <p className="text-3xl font-display font-black tracking-tight text-white">{stat.value}</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#1ECEFA]">{stat.label}</p>
                {/* Glow bar */}
                <div className="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-gradient-to-r from-transparent via-[#1ECEFA] to-transparent transition-transform duration-500 group-hover:scale-x-100" />
              </div>
            ))}
          </div>

          <section className="group relative mb-8 overflow-hidden rounded-3xl border border-[#1ECEFA]/20 bg-gradient-to-br from-[#161B22] to-[#0a1118] p-8 shadow-[0_0_30px_rgba(30,206,250,0.1)] transition-all hover:border-[#1ECEFA]/40">
            {/* Background Glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#1ECEFA]/10 blur-3xl transition-opacity group-hover:opacity-100" />

            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <div className="mb-2 flex items-center gap-2 text-[#1ECEFA]">
                  <Zap className="h-4 w-4 fill-current" />
                  <span className="text-xs font-bold uppercase tracking-widest">Rapid Deployment</span>
                </div>
                <h2 className="font-display text-2xl font-black text-white">Initialize Portfolio Sequence</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Connect third-party databases (LinkedIn, GitHub, Upwork) to auto-generate your professional matrix in 120 seconds. Zero unauthorized outbound data packets.
                </p>
              </div>
              <Link
                href="/portfolios/new"
                className="group/btn relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-[#1ECEFA] px-6 py-3.5 text-sm font-bold text-black shadow-[0_0_20px_rgba(30,206,250,0.4)] transition-all hover:scale-105 hover:bg-white active:scale-95"
              >
                <span>INITIATE PROTOCOL</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main content */}
            <div className="space-y-8 lg:col-span-2">
              {/* Quick actions */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1ECEFA]">
                  <PlusCircle className="h-4 w-4" /> Operations
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    { href: '/portfolios/new', label: 'Launch Portfolio', icon: <LayoutDashboard size={24} />, borderHover: 'hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:text-purple-300' },
                    { href: '/resumes/new', label: 'Draft Resume', icon: <Search size={24} />, borderHover: 'hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:text-blue-300' },
                    { href: '/cover-letters/new', label: 'Write Cover Letter', icon: <Star size={24} />, borderHover: 'hover:border-[#1ECEFA] hover:shadow-[0_0_20px_rgba(30,206,250,0.2)] hover:text-[#1ECEFA]' },
                  ].map((action) => (
                    <Link key={action.href} href={action.href}
                      className={`group flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-black/20 p-6 transition-all duration-300 ${action.borderHover}`}>
                      <div className="text-slate-500 transition-colors group-hover:text-current">
                        {action.icon}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors group-hover:text-white">{action.label}</span>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Assets grid */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1ECEFA]">
                    <Activity className="h-4 w-4" /> Active Nodes
                  </h2>
                  <Link href="/assets" className="text-xs font-bold tracking-widest text-slate-500 hover:text-white transition-colors">VIEW ALL_</Link>
                </div>

                {loading ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/5 bg-[#161B22]/50" />
                    ))}
                  </div>
                ) : assets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 p-12 text-center backdrop-blur-sm">
                    <LayoutDashboard className="mb-4 h-10 w-10 opacity-20" />
                    <p className="text-sm font-bold text-slate-400">Environment Empty</p>
                    <p className="mt-1 text-xs text-slate-500">Deploy your first node above to begin tracking.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {assets.slice(0, 6).map((asset) => (
                      <Link key={asset.id} href={`/${asset.type.toLowerCase().replace('_', '-')}s/${asset.id}/edit`}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#161B22]/80 p-5 shadow-lg backdrop-blur-md transition-all hover:-translate-y-1 hover:border-[#1ECEFA]/50 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="mb-3 flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 rounded-[4px] border border-transparent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TYPE_COLORS[asset.type]}`}>
                                {TYPE_ICONS[asset.type]} {asset.type.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="truncate font-display text-lg font-bold text-white transition-colors group-hover:text-[#1ECEFA]">{asset.title}</p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock className="h-3 w-3" /> Updated {new Date(asset.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="inline-flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-white/5 bg-black/40 shadow-inner">
                              <p className="text-lg font-black leading-none text-white">{asset.healthScore}</p>
                            </div>
                          </div>
                        </div>
                        {/* High-tech Health bar */}
                        <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-black/60 shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              (asset.healthScore || 0) > 80 ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 
                              (asset.healthScore || 0) > 50 ? 'bg-[#1ECEFA] shadow-[0_0_10px_#1ECEFA]' : 
                              'bg-red-500 shadow-[0_0_10px_#ef4444]'
                            }`}
                            style={{ width: `${Math.max(5, asset.healthScore || 0)}%` }}
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {user.tier === PlanTier.FREE && assets.length >= 3 && (
                  <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)] sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-sm font-bold text-red-400">Capacity Warning</h3>
                      <p className="text-xs text-red-300/80">System architecture limited to 3 nodes on current tier.</p>
                    </div>
                    <Link href="/checkout" className="shrink-0 rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all hover:bg-white hover:text-red-500">
                      UNLOCK ARCHITECTURE
                    </Link>
                  </div>
                )}
              </section>

              {/* Badges */}
              {user.badges && user.badges.length > 0 && (
                <section>
                  <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1ECEFA]">
                    <Award className="h-4 w-4" /> Achievements
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {user.badges.map((badge) => (
                      <div key={badge.id} className="group flex cursor-default items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2 shadow-sm transition-all hover:border-[#1ECEFA]/50 hover:bg-[#1ECEFA]/10"
                        title={badge.description}>
                        <Award className="h-4 w-4 text-yellow-500 transition-transform group-hover:scale-110" />
                        <span className="text-xs font-bold text-slate-300 transition-colors group-hover:text-white">{badge.name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right sidebar */}
            <aside className="space-y-6">
              {/* Notifications */}
              <div className="rounded-3xl border border-white/10 bg-[#161B22]/80 p-6 shadow-xl backdrop-blur-md">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
                    <Bell className="h-4 w-4 text-[#1ECEFA]" /> Comms
                  </h2>
                  {unreadCount > 0 ? (
                    <span className="flex h-5 items-center justify-center rounded-full bg-[#1ECEFA] px-2 text-[10px] font-bold text-black shadow-[0_0_10px_#1ECEFA]">
                      {unreadCount} NEW
                    </span>
                  ) : null}
                </div>
                
                <div className="space-y-2">
                  {notifications.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/5 p-4 text-center">
                      <p className="text-xs text-slate-500">Signal clear.</p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notif) => (
                      <button key={notif.id} onClick={() => markRead(notif.id)}
                        className={`group relative w-full overflow-hidden rounded-xl border p-4 text-left transition-all ${
                          notif.read 
                            ? 'border-white/5 bg-black/20 text-slate-500 hover:border-white/20 hover:text-slate-300' 
                            : 'border-[#1ECEFA]/30 bg-[#1ECEFA]/5 text-[#1ECEFA] hover:border-[#1ECEFA] shadow-[inset_0_0_15px_rgba(30,206,250,0.05)]'
                        }`}>
                        {!notif.read && (
                          <div className="absolute left-0 top-0 h-full w-[3px] bg-[#1ECEFA] shadow-[0_0_10px_#1ECEFA]" />
                        )}
                        <p className={`text-xs ${notif.read ? '' : 'font-bold'}`}>{notif.title}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Upgrade card for free users */}
              {user.tier === PlanTier.FREE && (
                <div className="group relative overflow-hidden rounded-3xl border border-purple-500/30 bg-black/40 p-6 shadow-xl backdrop-blur-md">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent transition-opacity group-hover:opacity-100" />
                  
                  <div className="relative z-10">
                    <div className="mb-2 flex items-center gap-2 text-purple-400">
                      <Rocket className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">System Upgrade</span>
                    </div>
                    <p className="font-display text-xl font-black text-white">Unlock PRO Matrix</p>
                    <ul className="mt-4 space-y-2">
                      {[
                        'Deploy up to 25 active nodes',
                        'Neural AI architecture critiques',
                        'Attach custom DNS routing',
                        'Advanced traffic telemetry',
                      ].map((item, i) => (
                         <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                           <div className="mt-[2px] h-3 w-3 rounded-full border border-purple-500/50 bg-purple-500/20" />
                           {item}
                         </li>
                      ))}
                    </ul>
                    <Link href="/checkout"
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-xs font-bold tracking-wider text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all hover:bg-white hover:text-purple-700 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                      INITIATE UPGRADE ($9.99/mo)
                    </Link>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </FeaturePage>
      </div>
    </div>
  );
}

