'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarLeft, SidebarRight, Bell } from '@/components/ui/icons';
import { SIDEBAR_ITEMS } from '@/lib/navigation';
import { notificationsApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';

interface NavbarProps {
  collapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

export function Navbar({ collapsed, onToggle }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const unreadCount = useBloxStore((s) => s.unreadNotificationCount);
  const setUnreadCount = useBloxStore((s) => s.setUnreadNotificationCount);
  const isAuthenticated = useBloxStore((s) => s.isAuthenticated);

  // Find current page title from SIDEBAR_ITEMS
  const currentItem = SIDEBAR_ITEMS.find((item) =>
    pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
  );
  const pageTitle = currentItem ? currentItem.label : pathname === '/notifications' ? 'Notifications' : 'Overview';

  // Poll unread count every 60 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCount = () => {
      notificationsApi.unreadCount()
        .then((res) => setUnreadCount(res.count))
        .catch(() => undefined);
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, setUnreadCount]);

  const displayCount = Math.min(unreadCount, 99);

  return (
    <header className="sticky top-0 z-20 w-full border-b border-white/5 bg-[#0C0F13]/60 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onToggle(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all active:scale-95"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? (
              <SidebarRight className="h-5 w-5" strokeWidth={2} />
            ) : (
              <SidebarLeft className="h-5 w-5" strokeWidth={2} />
            )}
          </button>

          <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />

          <h1 className="text-sm font-semibold text-white">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/notifications')}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-[#1ECEFA] hover:border-[#1ECEFA]/30 transition-all active:scale-95"
            title="Notifications"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell className="h-5 w-5" strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white leading-none ring-2 ring-[#0C0F13]">
                {displayCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
