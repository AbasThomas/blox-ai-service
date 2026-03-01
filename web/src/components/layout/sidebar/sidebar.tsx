'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useBloxStore } from '@/lib/store/app-store';
import { SIDEBAR_ITEMS } from '@/lib/navigation';
import { LogOut, Bot, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('blox_sidebar_collapsed');
    if (stored) setCollapsed(stored === '1');
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('blox_sidebar_collapsed', next ? '1' : '0');
    }
  };

  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-white/10 bg-[#0a1118]/80 backdrop-blur-3xl transition-all ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex h-16 items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#1ECEFA] to-blue-600">
            <Bot className="h-5 w-5 text-black" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <Link href="/dashboard" className="group">
              <span className="font-display text-lg font-black tracking-tight text-white group-hover:text-[#1ECEFA] transition-colors">
                BLOX
              </span>
            </Link>
          )}
        </div>
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand' : 'Collapse'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6 custom-scrollbar">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center rounded-lg px-3 py-2 transition-colors ${
                isActive
                  ? 'bg-white/5 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {Icon && (
                <Icon
                  className={`h-5 w-5 shrink-0 ${isActive ? '' : 'opacity-80 group-hover:opacity-100'}`}
                />
              )}
              {!collapsed && (
                <span className="ml-3 text-sm font-semibold">{item.label}</span>
              )}
              {item.href === '/dashboard' && unreadCount > 0 && (
                <span
                  className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1ECEFA] px-1.5 text-[10px] font-black text-black ${
                    collapsed ? 'ml-0' : ''
                  }`}
                  title={`${unreadCount} unread`}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 bg-[#0C0F13]/50 p-3">
        <div className={`flex items-center ${collapsed ? 'justify-between' : 'gap-3'}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 text-sm font-bold text-white uppercase">
            {user.name.charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-white">{user.name}</span>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${tierTone[user.tier]}`}>
                  {user.tier}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-colors"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
