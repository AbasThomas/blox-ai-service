'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notificationsApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function getNotificationMeta(type: string): { emoji: string; color: string } {
  switch (type) {
    case 'asset_generated':       return { emoji: '✨', color: 'text-indigo-400' };
    case 'portfolio_published':   return { emoji: '🌐', color: 'text-emerald-400' };
    case 'portfolio_viewed':      return { emoji: '👁️', color: 'text-blue-400' };
    case 'health_score_improved': return { emoji: '📈', color: 'text-emerald-400' };
    case 'export_completed':      return { emoji: '📄', color: 'text-slate-400' };
    case 'subscription_activated':return { emoji: '💎', color: 'text-indigo-400' };
    case 'subscription_cancelled':return { emoji: '⚠️', color: 'text-amber-400' };
    case 'payment_failed':        return { emoji: '❌', color: 'text-rose-400' };
    case 'payment_success':       return { emoji: '✅', color: 'text-emerald-400' };
    case 'new_comment':           return { emoji: '💬', color: 'text-blue-400' };
    case 'collaboration_invite':  return { emoji: '🤝', color: 'text-purple-400' };
    default:                      return { emoji: '🔔', color: 'text-slate-400' };
  }
}

// ─── Filter Tabs ─────────────────────────────────────────────────────────────

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all',       label: 'All' },
  { key: 'unread',    label: 'Unread' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'billing',   label: 'Billing' },
  { key: 'mentions',  label: 'Mentions' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const setUnreadCount = useBloxStore((s) => s.setUnreadNotificationCount);

  const [filter, setFilter]       = useState<FilterKey>('all');
  const [items, setItems]         = useState<NotificationItem[]>([]);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(false);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const markedOnLoad              = useRef(false);

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

  // Auto-mark all as read when the page first loads (once per mount)
  useEffect(() => {
    if (markedOnLoad.current) return;
    markedOnLoad.current = true;

    void fetchPage('all', 1, false).then(() => {
      notificationsApi.markRead()
        .then(() => setUnreadCount(0))
        .catch(() => undefined);
    });
  }, [fetchPage, setUnreadCount]);

  // Refetch on filter change (skip initial load since fetchPage already called above)
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

  const handleLoadMore = () => void fetchPage(filter, page + 1, true);

  const unreadInView = items.filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Notifications</h1>
          {total > 0 && (
            <p className="mt-0.5 text-xs text-slate-500">{total} total</p>
          )}
        </div>
        {unreadInView > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {markingAll ? 'Marking…' : 'Mark all as read'}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === f.key
                ? 'bg-indigo-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
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
            <div key={i} className="animate-pulse rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex gap-3">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-white/5" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-1/2 rounded-full bg-white/10" />
                  <div className="h-2.5 w-3/4 rounded-full bg-white/5" />
                </div>
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16">
            <span className="text-3xl" aria-hidden>🎉</span>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">You're all caught up!</p>
              <p className="mt-1 text-xs text-slate-500">No new notifications.</p>
            </div>
          </div>
        ) : (
          items.map((notif) => {
            const { emoji, color } = getNotificationMeta(notif.type);
            const isUnread = !notif.readAt;

            return (
              <div
                key={notif.id}
                className={`group relative flex gap-3 rounded-xl border p-4 transition-all ${
                  isUnread
                    ? 'border-indigo-500/15 bg-indigo-500/5 hover:bg-indigo-500/8'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                {/* Unread dot */}
                {isUnread && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-indigo-400" aria-label="Unread" />
                )}

                {/* Icon */}
                <div
                  className={`ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-base ${color}`}
                  aria-hidden
                >
                  {emoji}
                </div>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-white' : 'font-medium text-slate-200'}`}>
                      {notif.title}
                    </p>
                    <time
                      dateTime={notif.createdAt}
                      className="shrink-0 text-[10px] text-slate-500 mt-0.5"
                    >
                      {formatRelativeTime(notif.createdAt)}
                    </time>
                  </div>

                  {notif.message && (
                    <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>
                  )}

                  {notif.link && (
                    <button
                      onClick={() => router.push(notif.link!)}
                      className="mt-1.5 w-fit rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-300 transition-all hover:bg-indigo-500/20 hover:text-indigo-200"
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
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
