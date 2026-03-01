'use client';

import { FeaturePage } from '@/components/shared/feature-page';
import { Activity, Users, MousePointerClick, Globe, ArrowUpRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useBloxStore } from '@/lib/store/app-store';
import { PlanTier } from '@nextjs-blox/shared-types';

export default function AnalyticsPage() {
  const user = useBloxStore((s) => s.user);

  return (
    <FeaturePage 
      title="TELEMETRY DASHBOARD" 
      description="Monitor inbound traffic, node stability, and global engagement metrics across all deployed assets."
      headerIcon={<Activity className="h-6 w-6" />}
    >
      {/* KPI Row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Unique Visitors', value: '1.2K', change: '+12%', icon: Users },
          { label: 'Asset Clicks', value: '345', change: '+8%', icon: MousePointerClick },
          { label: 'Global Nodes', value: '4', change: '0%', icon: Globe },
          { label: 'Response Time', value: '45ms', change: '-5ms', icon: Activity },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md transition-all hover:border-[#1ECEFA]/30 hover:bg-[#161B22]/80">
              <div className="absolute right-3 top-3 text-[#1ECEFA] transition-transform group-hover:scale-110">
                <Icon className="h-4 w-4 opacity-50" />
              </div>
              <p className="text-2xl font-display font-black tracking-tight text-white group-hover:text-[#1ECEFA] transition-colors">{kpi.value}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1ECEFA]/70">{kpi.label}</span>
                <span className="flex items-center text-[10px] font-bold text-green-400">
                  <ArrowUpRight className="h-3 w-3" /> {kpi.change}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-gradient-to-r from-transparent via-[#1ECEFA] to-transparent transition-transform duration-500 group-hover:scale-x-100" />
            </div>
          );
        })}
      </div>

      {user.tier === PlanTier.FREE ? (
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-black/60 p-12 text-center backdrop-blur-md shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 mx-auto max-w-lg">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-black border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <ShieldAlert className="h-10 w-10 text-purple-400" />
            </div>
            <h2 className="font-display text-2xl font-black text-white">Encrypted Signal</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Advanced telemetry and geographical routing data are locked behind the PRO perimeter. Upgrade your clearance level to decrypt full analytics tracking.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/checkout" className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-purple-600 px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all hover:scale-105 hover:bg-white hover:text-purple-700 active:scale-95">
                <span>INITIATE PRO UPGRADE</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Chart Placeholder */}
          <div className="lg:col-span-2 space-y-4 rounded-3xl border border-white/10 bg-[#161B22]/60 p-6 shadow-xl backdrop-blur-md">
            <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#1ECEFA]">
               <Activity className="h-4 w-4" /> Traffic Volume
            </h3>
            {/* Chart Graphic Stub */}
            <div className="relative h-64 w-full overflow-hidden rounded-xl border border-white/5 bg-black/40">
               {/* Grid Lines */}
               <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-10">
                 {[1,2,3,4,5].map((i) => <div key={i} className="h-px w-full bg-white" />)}
               </div>
               {/* Graph Area */}
               <div className="absolute bottom-4 left-4 right-4 h-32 bg-gradient-to-t from-[#1ECEFA]/20 to-transparent border-t-2 border-[#1ECEFA] rounded-t-lg [clip-path:polygon(0_60%,20%_80%,40%_40%,60%_70%,80%_20%,100%_50%,100%_100%,0_100%)]" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <span className="rounded-lg bg-black/60 px-3 py-1 font-mono text-xs text-slate-500 backdrop-blur-sm">Chart instance rendering...</span>
               </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="space-y-4 rounded-3xl border border-white/10 bg-[#161B22]/60 p-6 shadow-xl backdrop-blur-md">
            <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">
               <Globe className="h-4 w-4 text-[#1ECEFA]" /> Geolocation Hits
            </h3>
            <div className="space-y-3 pt-2">
               {[
                 { locale: 'San Francisco, CA', hits: 432 },
                 { locale: 'London, UK', hits: 310 },
                 { locale: 'Berlin, DE', hits: 154 },
                 { locale: 'Toronto, CA', hits: 98 },
               ].map((geo, i) => (
                 <div key={i} className="flex items-center justify-between rounded-lg border border-transparent bg-black/20 px-3 py-2 transition-colors hover:border-white/5 hover:bg-black/40">
                   <span className="text-xs font-bold text-slate-300">{geo.locale}</span>
                   <span className="font-mono text-xs font-bold text-[#1ECEFA]">{geo.hits}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </FeaturePage>
  );
}
