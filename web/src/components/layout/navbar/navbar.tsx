'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Bell, Plus } from '@/components/ui/icons';
import { SIDEBAR_ITEMS } from '@/lib/navigation';
import { notificationsApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';

interface NavbarProps {
  collapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

// Which sections get a "New" shortcut button
const QUICK_CREATE: Record<string, string> = {
  '/portfolios':    '/portfolios/new',
  '/resumes':       '/resumes/new',
  '/cover-letters': '/cover-letters/new',
};

export function Navbar({ collapsed, onToggle }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const unreadCount = useBloxStore((s) => s.unreadNotificationCount);
  const setUnreadCount = useBloxStore((s) => s.setUnreadNotificationCount);
  const isAuthenticated = useBloxStore((s) => s.isAuthenticated);

  const currentItem = SIDEBAR_ITEMS.find(
    (item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
  );
  const pageTitle = currentItem?.label ?? (pathname === '/notifications' ? 'Notifications' : 'Overview');

  // Determine quick-create href based on current path prefix
  const quickCreateHref = Object.entries(QUICK_CREATE).find(([prefix]) =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  )?.[1] ?? null;

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
    <header className="sticky top-0 z-20 w-full border-b border-[#13171F] bg-[#080A0E]/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-5">

        {/* Left — toggle + breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggle(!collapsed)}
            className="flex h-8 w-8 items-center justify-center rounded text-[#46566A] hover:text-white transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={18} strokeWidth={2} />
          </button>

          {/* Divider + page title */}
          <div className="flex items-center gap-2 select-none">
            <span className="font-mono text-[13px] text-[#2E3847]">/</span>
            <span className="text-[14px] font-semibold text-white tracking-tight">{pageTitle}</span>
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1.5">
          {/* Context-aware New button */}
          {quickCreateHref && (
            <Link
              href={quickCreateHref}
              className="flex items-center gap-1.5 h-[30px] px-3 rounded bg-[#1ECEFA] text-[#06080C] text-[12px] font-bold hover:bg-[#3DD5FF] transition-colors"
            >
              <Plus size={13} strokeWidth={3} />
              New
            </Link>
          )}

          {/* Notifications */}
          <button
            onClick={() => router.push('/notifications')}
            className="relative flex h-8 w-8 items-center justify-center rounded text-[#46566A] hover:text-white transition-colors"
            title={`Notifications${unreadCount > 0 ? ` — ${displayCount} unread` : ''}`}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell size={18} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute top-[6px] right-[6px] h-[6px] w-[6px] rounded-full bg-rose-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
