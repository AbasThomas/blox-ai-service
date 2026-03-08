'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notificationsApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationPage {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  unreadCount: number;
}

type FilterKey = 'all' | 'unread' | 'portfolio' | 'billing' | 'mentions';

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getNotificationAccent(type: string): string {
  switch (type) {
    case 'asset_generated':
    case 'subscription_activated':
    case 'collaboration_invite': return 'bg-violet-500';
    case 'portfolio_published':
    case 'health_score_improved':
    case 'payment_success': return 'bg-emerald-500';
    case 'portfolio_viewed':
    case 'new_comment': return 'bg-[#1ECEFA]';
    case 'export_completed': return 'bg-[#4E5C6E]';
    case 'subscription_cancelled':
    case 'payment_failed': return 'bg-rose-500';
    default: return 'bg-[#2E3847]';
  }
}

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'billing', label: 'Billing' },
  { key: 'mentions', label: 'Mentions' },
];

export default function NotificationsPage() {
  const router = useRouter();
  const setUnreadCount = useBloxStore((s) => s.setUnreadNotificationCount);

  const [filter, setFilter] = useState<FilterKey>('all');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const markedOnLoad = useRef(false);

  const fetchPage = useCallback(async (f: FilterKey, p: number, append: boolean) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = (await notificationsApi.list({ page: p, limit: 20, filter: f })) as NotificationPage;
      setItems((prev) => append ? [...prev, ...res.items] : res.items);
      setPage(p);
      setHasMore(res.hasMore);
      setTotal(res.total);
      setUnreadCount(res.unreadCount);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    if (markedOnLoad.current) return;
    markedOnLoad.current = true;
    void fetchPage('all', 1, false).then(() => {
      notificationsApi.markRead().then(() => setUnreadCount(0)).catch(() => undefined);
    });
  }, [fetchPage, setUnreadCount]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    void fetchPage(filter, 1, false);
  }, [filter, fetchPage]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markRead();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch { /* ignore */ } finally {
      setMarkingAll(false);
    }
  };

  const unreadInView = items.filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto max-w-2xl space-y-5 py-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Notifications</h1>
          {total > 0 && <p className="mt-0.5 font-mono text-[11px] text-[#4E5C6E]">{total} total</p>}
        </div>
        {unreadInView > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="inline-flex items-center h-8 px-3 rounded border border-[#1B2131] text-[12px] font-medium text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] disabled:opacity-50 transition-colors"
          >
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center h-8 rounded border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 h-8 text-[12px] font-medium transition-colors border-r border-[#1B2131] last:border-r-0 ${
              filter === f.key ? 'bg-[#141C28] text-white' : 'text-[#46566A] hover:text-[#8899AA]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-1">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-md border border-[#1B2131] bg-[#0B0E14]" />
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[#1B2131] py-16 text-center">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <div>
              <p className="text-[13px] font-medium text-[#8899AA]">All caught up</p>
              <p className="mt-0.5 text-[12px] text-[#4E5C6E]">No notifications here.</p>
            </div>
          </div>
        ) : (
          items.map((notif) => {
            const isUnread = !notif.readAt;
            const accent = getNotificationAccent(notif.type);

            return (
              <div
                key={notif.id}
                className={`group relative flex gap-3 rounded-md border px-4 py-3 transition-colors ${
                  isUnread
                    ? 'border-[#1B2131] bg-[#0B0E14] hover:bg-[#0d1018]'
                    : 'border-transparent bg-transparent hover:bg-[#0B0E14]'
                }`}
              >
                {/* Left accent dot */}
                <div className="relative flex shrink-0 items-start pt-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${isUnread ? accent : 'bg-[#1B2131]'}`} />
                </div>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-[13px] leading-snug ${isUnread ? 'font-semibold text-white' : 'font-medium text-[#8899AA]'}`}>
                      {notif.title}
                    </p>
                    <time dateTime={notif.createdAt} className="shrink-0 font-mono text-[10px] text-[#3A4452] mt-0.5">
                      {formatRelativeTime(notif.createdAt)}
                    </time>
                  </div>

                  {notif.message && (
                    <p className="text-[12px] text-[#4E5C6E] leading-relaxed">{notif.message}</p>
                  )}

                  {notif.link && (
                    <button
                      onClick={() => router.push(notif.link!)}
                      className="mt-1.5 w-fit inline-flex items-center h-6 px-2 rounded border border-[#1B2131] text-[11px] text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] transition-colors"
                    >
                      View →
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Load more */}
      {hasMore && !loading && (
        <div className="flex justify-center">
          <button
            onClick={() => void fetchPage(filter, page + 1, true)}
            disabled={loadingMore}
            className="inline-flex items-center h-8 px-5 rounded border border-[#1B2131] text-[12px] font-medium text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] disabled:opacity-50 transition-colors"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
