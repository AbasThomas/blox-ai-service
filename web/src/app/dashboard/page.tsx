'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { useBloxStore, Asset } from '@/lib/store/app-store';
import { assetsApi } from '@/lib/api';
import { PlanTier } from '@nextjs-blox/shared-types';

const TYPE_ICONS: Record<string, string> = {
  PORTFOLIO: '🎨',
  RESUME: '📄',
  COVER_LETTER: '✉️',
};

const TYPE_COLORS: Record<string, string> = {
  PORTFOLIO: 'bg-purple-100 text-purple-800',
  RESUME: 'bg-blue-100 text-blue-800',
  COVER_LETTER: 'bg-green-100 text-green-800',
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
    <FeaturePage
      title={`Welcome back, ${user.name.split(' ')[0]}`}
      description={`You are on the ${user.tier} plan. ${user.tier === PlanTier.FREE ? 'Upgrade to unlock more features.' : 'All premium features are active.'}`}
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        {[
          { label: 'Total Assets', value: assets.length },
          { label: 'Published', value: published },
          { label: 'Avg Health Score', value: `${avgHealth}/100` },
          { label: 'Day Streak', value: `${user.streak ?? 0} 🔥` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick actions */}
          <section>
            <h2 className="mb-3 text-base font-bold text-slate-900">Quick actions</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { href: '/portfolios/new', label: 'New Portfolio', icon: '🎨', color: 'bg-purple-50 border-purple-200 hover:border-purple-400' },
                { href: '/resumes/new', label: 'New Resume', icon: '📄', color: 'bg-blue-50 border-blue-200 hover:border-blue-400' },
                { href: '/cover-letters/new', label: 'New Cover Letter', icon: '✉️', color: 'bg-green-50 border-green-200 hover:border-green-400' },
              ].map((action) => (
                <Link key={action.href} href={action.href}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${action.color}`}>
                  <span className="text-2xl">{action.icon}</span>
                  <span className="text-xs font-semibold text-slate-700">{action.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Assets grid */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">Your Assets</h2>
              <Link href="/assets" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : assets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <p className="text-sm text-slate-500">No assets yet. Create your first one above.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {assets.slice(0, 6).map((asset) => (
                  <Link key={asset.id} href={`/${asset.type.toLowerCase().replace('_', '-')}s/${asset.id}/edit`}
                    className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[asset.type]}`}>
                            {TYPE_ICONS[asset.type]} {asset.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="truncate text-sm font-semibold text-slate-900">{asset.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Updated {new Date(asset.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-3 text-right">
                        <p className="text-lg font-black text-slate-900">{asset.healthScore}</p>
                        <p className="text-xs text-slate-400">health</p>
                      </div>
                    </div>
                    {/* Health bar */}
                    <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${asset.healthScore}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {user.tier === PlanTier.FREE && assets.length >= 3 && (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-center justify-between">
                <p className="text-sm text-amber-800">You&apos;ve reached the Free plan limit (3 assets).</p>
                <Link href="/checkout" className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700">
                  Upgrade
                </Link>
              </div>
            )}
          </section>

          {/* Badges */}
          {user.badges && user.badges.length > 0 && (
            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">Your Badges</h2>
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge) => (
                  <div key={badge.id} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium shadow-sm"
                    title={badge.description}>
                    <span>{badge.icon === 'star' ? '⭐' : badge.icon === 'fire' ? '🔥' : '🏆'}</span>
                    <span>{badge.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Notifications sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-500">All caught up!</p>
              ) : (
                notifications.slice(0, 5).map((notif) => (
                  <button key={notif.id} onClick={() => markRead(notif.id)}
                    className={`w-full rounded-lg p-3 text-left text-xs transition-colors ${
                      notif.read ? 'bg-slate-50 text-slate-500' : 'bg-blue-50 text-blue-900 font-medium'
                    }`}>
                    {notif.title}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Upgrade card for free users */}
          {user.tier === PlanTier.FREE && (
            <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 p-4">
              <p className="text-sm font-bold text-slate-900">Unlock Pro features</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                <li>✓ 25 assets</li>
                <li>✓ AI critiques & suggestions</li>
                <li>✓ Custom domains</li>
                <li>✓ Advanced analytics</li>
              </ul>
              <Link href="/checkout"
                className="mt-3 block rounded-md bg-blue-600 px-3 py-2 text-center text-xs font-bold text-white hover:bg-blue-700">
                Upgrade to Pro — $9.99/mo
              </Link>
            </div>
          )}
        </aside>
      </div>
    </FeaturePage>
  );
}

