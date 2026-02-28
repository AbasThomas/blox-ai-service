'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { analyticsApi, assetsApi } from '@/lib/api';

interface LinkTracker {
  id: string;
  shortCode: string;
  source?: string;
  targetUrl: string;
  clickCount: number;
  createdAt: string;
}

interface AnalyticsData {
  totalViews: number;
  totalClicks: number;
  uniqueVisitors: number;
  topSources: Array<{ source: string; count: number }>;
  dailyViews: Array<{ date: string; count: number }>;
  links: LinkTracker[];
}

const PERIODS = ['7d', '30d', '90d'] as const;
type Period = typeof PERIODS[number];

export default function AnalyticsPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');
  const [assetTitle, setAssetTitle] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);
  const [newLinkSource, setNewLinkSource] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - parseInt(period));
      const [analytics, asset] = await Promise.all([
        analyticsApi.getAssetAnalytics(params.id, { from: fromDate.toISOString() }) as Promise<AnalyticsData>,
        assetsApi.getById(params.id) as Promise<{ title: string }>,
      ]);
      setData(analytics);
      setAssetTitle(asset.title);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [params.id, period]);

  useEffect(() => { load(); }, [load]);

  const handleCreateLink = async () => {
    if (!newLinkSource.trim()) return;
    setCreatingLink(true);
    try {
      const link = await analyticsApi.createShortLink(params.id, newLinkSource) as LinkTracker;
      setData((prev) => prev ? { ...prev, links: [link, ...prev.links] } : prev);
      setNewLinkSource('');
    } catch { /* ignore */ }
    finally { setCreatingLink(false); }
  };

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333';

  const STAT_CARDS = data ? [
    { label: 'Total views', value: data.totalViews.toLocaleString() },
    { label: 'Total clicks', value: data.totalClicks.toLocaleString() },
    { label: 'Unique visitors', value: data.uniqueVisitors.toLocaleString() },
    { label: 'CTR', value: data.totalViews > 0 ? `${((data.totalClicks / data.totalViews) * 100).toFixed(1)}%` : '—' },
  ] : [];

  return (
    <FeaturePage title={assetTitle ? `Analytics: ${assetTitle}` : 'Analytics'} description="Track views, clicks, referrals, and short links.">
      {/* Period selector */}
      <div className="flex items-center gap-2 mb-6">
        {PERIODS.map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              period === p ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
          <p className="text-sm">No analytics data yet. Share your asset to start tracking.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAT_CARDS.map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                <p className="text-2xl font-black text-slate-900">{s.value}</p>
                <p className="mt-1 text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Daily views chart */}
            {data.dailyViews.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Daily views</h3>
                <div className="flex items-end gap-1 h-32">
                  {data.dailyViews.slice(-14).map((d) => {
                    const max = Math.max(...data.dailyViews.map((v) => v.count), 1);
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count} views`}>
                        <div className="w-full rounded-t bg-blue-500" style={{ height: `${(d.count / max) * 100}%` }} />
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">Last 14 days</p>
              </div>
            )}

            {/* Top sources */}
            {data.topSources.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Top sources</h3>
                <div className="space-y-3">
                  {data.topSources.slice(0, 6).map((s) => {
                    const max = Math.max(...data.topSources.map((x) => x.count), 1);
                    return (
                      <div key={s.source} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 font-medium capitalize">{s.source || 'Direct'}</span>
                          <span className="text-slate-500">{s.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100">
                          <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${(s.count / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Short links */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Short links</h3>
            <div className="flex gap-2 mb-4">
              <input value={newLinkSource} onChange={(e) => setNewLinkSource(e.target.value)}
                placeholder="Source label (e.g. linkedin, email)"
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={handleCreateLink} disabled={creatingLink || !newLinkSource.trim()}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
                {creatingLink ? '...' : 'Create'}
              </button>
            </div>
            {data.links.length === 0 ? (
              <p className="text-sm text-slate-400">No links yet.</p>
            ) : (
              <div className="space-y-2">
                {data.links.map((link) => (
                  <div key={link.id} className="flex items-center justify-between text-sm rounded-lg border border-slate-100 px-3 py-2">
                    <div>
                      <span className="font-mono text-xs text-blue-600">{apiBase}/s/{link.shortCode}</span>
                      {link.source && <span className="ml-2 text-xs text-slate-400">({link.source})</span>}
                    </div>
                    <span className="text-xs font-medium text-slate-900">{link.clickCount} clicks</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </FeaturePage>
  );
}
