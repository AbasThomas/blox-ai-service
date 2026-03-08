'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBloxStore } from '@/lib/store/app-store';
import { SIDEBAR_ITEMS } from '@/lib/navigation';
import { Logo } from '@/components/ui/logo';
import { LogOut } from '@/components/ui/icons';
import { PlanTier } from '@nextjs-blox/shared-types';

// Group indices into sections
const NAV_GROUPS: { label: string; indices: number[] }[] = [
  { label: 'workspace', indices: [0, 1, 2, 3] },
  { label: 'tools',     indices: [4, 5, 6] },
  { label: 'account',   indices: [7, 8] },
];

const tierDot: Record<PlanTier, string> = {
  [PlanTier.FREE]:       'bg-slate-500',
  [PlanTier.PRO]:        'bg-[#1ECEFA]',
  [PlanTier.PREMIUM]:    'bg-amber-400',
  [PlanTier.ENTERPRISE]: 'bg-violet-400',
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
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-[#13171F] bg-[#080A0E] transition-all duration-300 ${
          collapsed ? '-translate-x-full lg:translate-x-0 lg:w-14' : 'translate-x-0 w-[220px]'
        }`}
      >
        {/* Logo row */}
        <div className={`flex h-14 shrink-0 items-center border-b border-[#13171F] ${collapsed ? 'lg:justify-center' : 'px-4'}`}>
          <Link href="/dashboard">
            <Logo size="md" iconOnly={collapsed} />
          </Link>
        </div>

        {/* Nav */}
        <nav className="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden py-2">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? 'mt-1 pt-1 border-t border-[#13171F]' : ''}>

              {/* Section label — only when expanded */}
              {!collapsed && (
                <div className="px-4 pt-2 pb-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#2E3847]">
                    {group.label}
                  </span>
                </div>
              )}

              {group.indices.map((idx) => {
                const item = SIDEBAR_ITEMS[idx];
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) onToggle(true);
                    }}
                    className={`group relative flex items-center h-9 transition-colors duration-150 ${
                      collapsed ? 'lg:w-14 lg:justify-center' : 'px-4'
                    } ${
                      isActive
                        ? 'bg-[#0D1117] text-white'
                        : 'text-[#46566A] hover:text-[#A0B0C0] hover:bg-[#0C0F14]'
                    }`}
                  >
                    {/* Active left bar */}
                    {isActive && (
                      <span className="absolute left-0 top-[7px] bottom-[7px] w-[2px] rounded-r-full bg-[#1ECEFA]" />
                    )}

                    {Icon && (
                      <Icon
                        size={17}
                        strokeWidth={isActive ? 2.2 : 1.7}
                        className={`shrink-0 ${isActive ? 'text-[#1ECEFA]' : ''}`}
                      />
                    )}

                    {!collapsed && (
                      <span className="ml-3 text-[13px] font-medium leading-none truncate">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="shrink-0 border-t border-[#13171F] bg-[#060809]">
          <div className={`flex items-center h-[52px] ${collapsed ? 'lg:justify-center' : 'px-3 gap-2.5'}`}>
            {/* Avatar with tier dot */}
            <div className="relative shrink-0">
              <div className="h-7 w-7 rounded-full bg-[#181F2B] flex items-center justify-center text-[11px] font-bold text-slate-300 uppercase select-none">
                {user.name.charAt(0)}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 h-[7px] w-[7px] rounded-full border-[1.5px] border-[#060809] ${tierDot[user.tier]}`} />
            </div>

            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white truncate leading-none">{user.name}</p>
                  <p className="mt-[3px] font-mono text-[10px] uppercase tracking-[0.1em] text-[#2E3847]">{user.tier}</p>
                </div>
                <button
                  onClick={logout}
                  className="flex h-7 w-7 items-center justify-center rounded text-[#2E3847] hover:text-rose-400 transition-colors"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut size={15} strokeWidth={1.8} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => onToggle(true)}
        />
      )}
    </>
  );
}
