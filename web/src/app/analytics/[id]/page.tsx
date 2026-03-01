'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { analyticsApi, assetsApi } from '@/lib/api';

interface LinkTracker {
  id: string;
  assetId: string;
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

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeAnalytics(assetId: string, payload: unknown): AnalyticsData {
  const raw = payload as Record<string, unknown>;
  const summary = (raw.summary as Record<string, unknown> | undefined) ?? null;
  const summaryLinks = Array.isArray(summary?.links) ? (summary.links as Array<Record<string, unknown>>) : [];
  const rawLinks = Array.isArray(raw.links) ? (raw.links as Array<Record<string, unknown>>) : [];
  const linksSource = summaryLinks.length > 0 ? summaryLinks : rawLinks;

  const links = linksSource.map((link) => ({
    id: String(link.id ?? crypto.randomUUID()),
    assetId: String(link.assetId ?? assetId),
    shortCode: String(link.shortCode ?? ''),
    source: typeof link.source === 'string' ? link.source : undefined,
    targetUrl: String(link.targetUrl ?? ''),
    clickCount: asNumber(link.clickCount, 0),
    createdAt: String(link.createdAt ?? new Date().toISOString()),
  }));

  const topSourcesFromRaw = Array.isArray(raw.topSources) ? (raw.topSources as Array<Record<string, unknown>>) : [];
  const topSources = topSourcesFromRaw.length > 0
    ? topSourcesFromRaw.map((item) => ({
        source: String(item.source ?? 'direct'),
        count: asNumber(item.count, 0),
      }))
    : [...new Map(
        links.map((link) => [(link.source ?? 'direct').toLowerCase(), 0] as const),
      ).keys()].map((source) => ({
        source,
        count: links
          .filter((link) => (link.source ?? 'direct').toLowerCase() === source)
          .reduce((sum, link) => sum + Math.max(1, link.clickCount), 0),
      })).sort((a, b) => b.count - a.count);

  const rawDaily = Array.isArray(raw.dailyViews) ? (raw.dailyViews as Array<Record<string, unknown>>) : [];
  const dailyViews = rawDaily.length > 0
    ? rawDaily.map((item) => ({
        date: String(item.date ?? ''),
        count: asNumber(item.count, 0),
      }))
    : [...new Map(
        links.map((link) => [new Date(link.createdAt).toISOString().slice(0, 10), 0] as const),
      ).keys()].map((date) => ({
        date,
        count: links
          .filter((link) => new Date(link.createdAt).toISOString().slice(0, 10) === date)
          .reduce((sum, link) => sum + Math.max(1, link.clickCount), 0),
      })).sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const totalViews = asNumber(summary?.views, asNumber(raw.totalViews, 0));
  const totalClicks = asNumber(summary?.clicks, asNumber(raw.totalClicks, 0));
  const uniqueVisitors = asNumber(raw.uniqueVisitors, Math.max(totalViews - Math.floor(totalClicks * 0.2), 0));

  return { totalViews, totalClicks, uniqueVisitors, topSources, dailyViews, links };
}

export default function AnalyticsPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');
  const [assetTitle, setAssetTitle] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);
  const [newLinkSource, setNewLinkSource] = useState('');
  const [newLinkTarget, setNewLinkTarget] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - parseInt(period, 10));
      const [analytics, asset] = await Promise.all([
        analyticsApi.getAssetAnalytics(params.id, { from: fromDate.toISOString() }),
        assetsApi.getById(params.id) as Promise<{ title: string; publishedUrl?: string }>,
      ]);
      setData(normalizeAnalytics(params.id, analytics));
      setAssetTitle(asset.title);
      setAssetUrl(asset.publishedUrl ?? '');
      setNewLinkTarget((previous) => previous || asset.publishedUrl || `${window.location.origin}/preview/${params.id}`);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [params.id, period]);

  useEffect(() => { load(); }, [load]);

  const handleCreateLink = async () => {
    if (!newLinkSource.trim() || !newLinkTarget.trim()) return;
    setCreatingLink(true);
    setMessage('');
    try {
      const link = await analyticsApi.createShortLink(params.id, newLinkSource.trim(), newLinkTarget.trim()) as LinkTracker;
      setData((prev) => {
        if (!prev) return prev;
        const links = [link, ...prev.links];
        const topSources = [...new Map(
          links.map((item) => [(item.source ?? 'direct').toLowerCase(), 0] as const),
        ).keys()].map((source) => ({
          source,
          count: links
            .filter((item) => (item.source ?? 'direct').toLowerCase() === source)
            .reduce((sum, item) => sum + Math.max(1, item.clickCount), 0),
        })).sort((a, b) => b.count - a.count);
        return { ...prev, links, topSources };
      });
      setNewLinkSource('');
      setMessage('Short link created.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create short link.');
    } finally {
      setCreatingLink(false);
    }
  };

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_APP_BASE_URL ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'), []);

  const statCards = data ? [
    { label: 'Total views', value: data.totalViews.toLocaleString() },
    { label: 'Total clicks', value: data.totalClicks.toLocaleString() },
    { label: 'Unique visitors', value: data.uniqueVisitors.toLocaleString() },
    { label: 'CTR', value: data.totalViews > 0 ? `${((data.totalClicks / data.totalViews) * 100).toFixed(1)}%` : '0.0%' },
  ] : [];

  return (
    <FeaturePage title={assetTitle ? `Analytics: ${assetTitle}` : 'Analytics'} description="Track views, clicks, referrals, and short links.">
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

      {assetUrl ? (
        <div className="mb-4 rounded-lg border border-[#1ECEFA]/20 bg-[#1ECEFA]/10 px-3 py-2 text-xs text-[#1ECEFA]">
          Live URL: {assetUrl}
        </div>
      ) : null}
      {message ? (
        <div className="mb-4 rounded-lg border border-[#1ECEFA]/20 bg-[#1ECEFA]/10 px-3 py-2 text-xs text-[#1ECEFA]">
          {message}
        </div>
      ) : null}

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Daily views</h3>
              {data.dailyViews.length === 0 ? (
                <p className="text-sm text-slate-400">No daily breakdown yet.</p>
              ) : (
                <>
                  <div className="flex items-end gap-1 h-32">
                    {data.dailyViews.slice(-14).map((day) => {
                      const max = Math.max(...data.dailyViews.map((value) => value.count), 1);
                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1" title={`${day.date}: ${day.count}`}>
                          <div className="w-full rounded-t bg-blue-500" style={{ height: `${(day.count / max) * 100}%` }} />
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">Last 14 data points</p>
                </>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Top sources</h3>
              {data.topSources.length === 0 ? (
                <p className="text-sm text-slate-400">No source data yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.topSources.slice(0, 6).map((source) => {
                    const max = Math.max(...data.topSources.map((item) => item.count), 1);
                    return (
                      <div key={source.source} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 font-medium capitalize">{source.source || 'Direct'}</span>
                          <span className="text-slate-500">{source.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100">
                          <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${(source.count / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Short links</h3>
            <div className="grid gap-2 mb-4 lg:grid-cols-[200px_1fr_auto]">
              <input value={newLinkSource} onChange={(event) => setNewLinkSource(event.target.value)}
                placeholder="Source label"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={newLinkTarget} onChange={(event) => setNewLinkTarget(event.target.value)}
                placeholder="Target URL (https://...)"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={handleCreateLink} disabled={creatingLink || !newLinkSource.trim() || !newLinkTarget.trim()}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
                {creatingLink ? '...' : 'Create'}
              </button>
            </div>
            {data.links.length === 0 ? (
              <p className="text-sm text-slate-400">No links yet.</p>
            ) : (
              <div className="space-y-2">
                {data.links.map((link) => (
                  <div key={link.id} className="flex flex-col gap-1 rounded-lg border border-slate-100 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-blue-600">{apiBase}/s/{link.shortCode}</span>
                      <span className="text-xs font-medium text-slate-900">{link.clickCount} clicks</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Source: {link.source ?? 'direct'}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {link.targetUrl}
                    </div>
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
