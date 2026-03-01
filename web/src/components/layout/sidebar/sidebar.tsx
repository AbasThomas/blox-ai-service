'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBloxStore } from '@/lib/store/app-store';
import { SIDEBAR_ITEMS } from '@/lib/navigation';
import { LogOut, Bot } from 'lucide-react';
import { PlanTier } from '@nextjs-blox/shared-types';

const tierTone: Record<PlanTier, string> = {
  [PlanTier.FREE]: 'bg-slate-800 text-slate-300 border-white/5',
  [PlanTier.PRO]: 'bg-cyan-500/10 text-[#1ECEFA] border-[#1ECEFA]/20',
  [PlanTier.PREMIUM]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  [PlanTier.ENTERPRISE]: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

export function Sidebar() {
  const pathname = usePathname();
  const user = useBloxStore((state) => state.user);
  const logout = useBloxStore((state) => state.logout);
  const notifications = useBloxStore((state) => state.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <aside className="relative z-20 flex w-64 flex-col border-r border-[#1ECEFA]/10 bg-[#0a1118]/80 backdrop-blur-3xl transition-all">
      {/* Brand Section */}
      <div className="flex h-20 items-center px-6 border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1ECEFA] to-blue-600 shadow-[0_0_15px_rgba(30,206,250,0.4)] transition-all group-hover:shadow-[0_0_25px_rgba(30,206,250,0.6)] group-hover:scale-105">
            <Bot className="h-6 w-6 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-black tracking-tight text-white group-hover:text-[#1ECEFA] transition-colors">BLOX</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-8 custom-scrollbar">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-[#1ECEFA]/20 to-transparent border-l-2 border-[#1ECEFA] text-[#1ECEFA] shadow-[inset_0_0_20px_rgba(30,206,250,0.1)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
              }`}
            >
              {Icon && <Icon className={`h-5 w-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(30,206,250,0.8)]' : 'opacity-70 group-hover:opacity-100'}`} />}
              <span className={`text-sm font-bold tracking-wider uppercase ${isActive ? '' : ''}`}>{item.label}</span>
              
              {/* Optional Notification Badge on Nav Items */}
              {item.href === '/dashboard' && unreadCount > 0 && (
                 <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1ECEFA] px-1.5 text-[10px] font-black text-black">
                   {unreadCount}
                 </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="border-t border-[#1ECEFA]/10 bg-[#0C0F13]/50 p-4 relative group/footer">
         <div className="flex items-center gap-3 w-full">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 text-sm font-bold text-white uppercase shadow-inner">
               {user.name.charAt(0)}
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
               <span className="truncate text-sm font-bold text-white transition-colors group-hover/footer:text-[#1ECEFA]">{user.name}</span>
               <div className="mt-1 flex items-center gap-2">
                 <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${tierTone[user.tier]}`}>
                   {user.tier}
                 </span>
               </div>
            </div>
            <button 
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-500 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all focus:outline-none"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
         </div>
         {/* Subtle Glow on Footer Hover */}
         <div className="absolute inset-0 z-[-1] bg-gradient-to-t from-[#1ECEFA]/5 to-transparent opacity-0 transition-opacity duration-500 group-hover/footer:opacity-100 pointer-events-none" />
      </div>
    </aside>
  );
}
