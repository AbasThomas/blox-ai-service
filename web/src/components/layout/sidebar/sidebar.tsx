'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBloxStore } from '@/lib/store/app-store';
import { SIDEBAR_ITEMS } from '@/lib/navigation';
import { Logo } from '@/components/ui/logo';
import { LogOut } from '@/components/ui/icons';
import { PlanTier } from '@nextjs-blox/shared-types';

const tierTone: Record<PlanTier, string> = {
  [PlanTier.FREE]: 'bg-slate-800 text-slate-300 border-white/5',
  [PlanTier.PRO]: 'bg-cyan-500/10 text-[#1ECEFA] border-[#1ECEFA]/20',
  [PlanTier.PREMIUM]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  [PlanTier.ENTERPRISE]: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const user = useBloxStore((state) => state.user);
  const logout = useBloxStore((state) => state.logout);

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col overflow-x-hidden border-r border-white/10 bg-[#0a1118]/95 backdrop-blur-3xl transition-all duration-300 ${
          collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64'
        }`}
      >
        <div className="flex h-16 items-center px-4 border-b border-white/5">
          <div className="flex items-center ml-1">
            <Link href="/dashboard" className="block hover:opacity-90 transition-opacity">
              <Logo size="md" iconOnly={collapsed} />
            </Link>
          </div>
      </div>

        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-6">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onToggle(true);
                }}
                className={`group flex min-w-0 items-center rounded-lg border transition-colors ${
                  collapsed ? 'lg:mx-auto lg:h-11 lg:w-11 lg:justify-center lg:px-0' : 'h-11 w-full px-3'
                } ${
                  isActive
                    ? 'border-[#1ECEFA]/35 bg-[#1ECEFA]/15 text-[#1ECEFA]'
                    : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white'
                }`}
              >
                {Icon && (
                  <Icon
                    className={`h-6 w-6 shrink-0 ${isActive ? '' : 'opacity-80 group-hover:opacity-100'}`}
                  />
                )}
                <span className={`ml-3 truncate text-[15px] font-semibold leading-none ${collapsed ? 'lg:hidden' : 'inline'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 bg-[#0C0F13]/50 p-3">
          <div className={`flex items-center ${collapsed ? 'lg:justify-center' : 'gap-3'}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 text-sm font-bold text-white uppercase">
              {user.name.charAt(0)}
            </div>
            <div className={`flex-1 flex-col overflow-hidden ${collapsed ? 'lg:hidden' : 'flex'}`}>
              <span className="truncate text-sm font-semibold text-white">{user.name}</span>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${tierTone[user.tier]}`}>
                  {user.tier}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-colors ${collapsed ? 'lg:hidden' : ''}`}
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
 
      {/* Mobile Overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => onToggle(true)}
        />
      )}
    </>
  );
}
