'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { analyticsApi, assetsApi } from '@/lib/api';
import { SparklineChart } from '@/components/analytics/SparklineChart';

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
type Period = (typeof PERIODS)[number];

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizeAnalytics(assetId: string, payload: unknown): AnalyticsData {
  const raw = payload as Record<string, unknown>;
  const summary = (raw.summary as Record<string, unknown> | undefined) ?? null;
  const summaryLinks = Array.isArray(summary?.links)
    ? (summary.links as Array<Record<string, unknown>>)
    : [];
  const rawLinks = Array.isArray(raw.links)
    ? (raw.links as Array<Record<string, unknown>>)
    : [];
  const linksSource = summaryLinks.length > 0 ? summaryLinks : rawLinks;

  const links = linksSource.map((link) => ({
    id: asString(link.id) || crypto.randomUUID(),
    assetId: asString(link.assetId) || assetId,
    shortCode: asString(link.shortCode),
    source: asString(link.source) || undefined,
    targetUrl: asString(link.targetUrl),
    clickCount: asNumber(link.clickCount, 0),
    createdAt: asString(link.createdAt) || new Date().toISOString(),
  }));

  const topSourcesRaw = Array.isArray(raw.topSources)
    ? (raw.topSources as Array<Record<string, unknown>>)
    : [];
  const topSources =
    topSourcesRaw.length > 0
      ? topSourcesRaw.map((item) => ({
          source: asString(item.source) || 'direct',
          count: asNumber(item.count, 0),
        }))
      : [
          ...new Set(
            links.map((item) => (item.source ?? 'direct').toLowerCase()),
          ),
        ]
          .map((source) => ({
            source,
            count: links
              .filter(
                (item) => (item.source ?? 'direct').toLowerCase() === source,
              )
              .reduce((sum, item) => sum + Math.max(1, item.clickCount), 0),
          }))
          .sort((a, b) => b.count - a.count);

  const dailyRaw = Array.isArray(raw.dailyViews)
    ? (raw.dailyViews as Array<Record<string, unknown>>)
    : [];
  const dailyViews =
    dailyRaw.length > 0
      ? dailyRaw
          .map((row) => ({
            date: asString(row.date),
            count: asNumber(row.count, 0),
          }))
          .filter((row) => row.date)
      : [...new Set(links.map((item) => item.createdAt.slice(0, 10)))]
          .map((date) => ({
            date,
            count: links
              .filter((item) => item.createdAt.startsWith(date))
              .reduce((sum, item) => sum + Math.max(1, item.clickCount), 0),
          }))
          .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const totalViews = asNumber(summary?.views, asNumber(raw.totalViews, 0));
  const totalClicks = asNumber(summary?.clicks, asNumber(raw.totalClicks, 0));
  const uniqueVisitors = asNumber(
    raw.uniqueVisitors,
    Math.max(totalViews - Math.floor(totalClicks * 0.2), 0),
  );

  return {
    totalViews,
    totalClicks,
    uniqueVisitors,
    topSources,
    dailyViews,
    links,
  };
}

function sanitizeUrl(raw: string) {
  const value = raw.trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `https://${value}`;
}

export default function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
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
    setMessage('');
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - parseInt(period, 10));
      const [analytics, asset] = await Promise.all([
        analyticsApi.getAssetAnalytics(id, {
          from: fromDate.toISOString(),
        }),
        assetsApi.getById(id) as Promise<{
          title: string;
          publishedUrl?: string;
        }>,
      ]);
      setData(normalizeAnalytics(id, analytics));
      setAssetTitle(asset.title);
      setAssetUrl(asset.publishedUrl ?? '');
      setNewLinkTarget(
        (previous) =>
          previous ||
          asset.publishedUrl ||
          `${window.location.origin}/preview/${id}`,
      );
    } catch (error) {
      setData(null);
      setMessage(
        error instanceof Error ? error.message : 'Could not load analytics.',
      );
    } finally {
      setLoading(false);
    }
  }, [id, period]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreateLink = async () => {
    const source = newLinkSource.trim();
    const targetUrl = sanitizeUrl(newLinkTarget);
    if (!source || !targetUrl) return;
    setCreatingLink(true);
    setMessage('');
    try {
      const created = (await analyticsApi.createShortLink(
        id,
        source,
        targetUrl,
      )) as LinkTracker;
      setData((previous) => {
        if (!previous) return previous;
        const links = [created, ...previous.links];
        const topSources = [
          ...new Set(
            links.map((row) => (row.source ?? 'direct').toLowerCase()),
          ),
        ]
          .map((sourceName) => ({
            source: sourceName,
            count: links
              .filter(
                (row) => (row.source ?? 'direct').toLowerCase() === sourceName,
              )
              .reduce((sum, row) => sum + Math.max(1, row.clickCount), 0),
          }))
          .sort((a, b) => b.count - a.count);
        return { ...previous, links, topSources };
      });
      setNewLinkSource('');
      setNewLinkTarget(targetUrl);
      setMessage('Short link created.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not create short link.',
      );
    } finally {
      setCreatingLink(false);
    }
  };

  const appBase = useMemo(
    () =>
      process.env.NEXT_PUBLIC_APP_BASE_URL ??
      (typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:4200'),
    [],
  );

  const statCards = data
    ? [
        { label: 'Total views', value: data.totalViews.toLocaleString() },
        { label: 'Total clicks', value: data.totalClicks.toLocaleString() },
        {
          label: 'Unique visitors',
          value: data.uniqueVisitors.toLocaleString(),
        },
        {
          label: 'CTR',
          value:
            data.totalViews > 0
              ? `${((data.totalClicks / data.totalViews) * 100).toFixed(1)}%`
              : '0.0%',
        },
      ]
    : [];

  const maxSource = Math.max(
    ...(data?.topSources.map((row) => row.count) ?? [1]),
    1,
  );

  return (
    <FeaturePage
      title={assetTitle ? `Analytics: ${assetTitle}` : 'Portfolio Analytics'}
      description="Track visits, link clicks, and source performance."
    >
      <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5 overflow-x-hidden">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#0C1118] p-3">
          <button
            type="button"
            onClick={() => router.push(`/portfolios/${id}/edit`)}
            className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
          >
            Open editor
          </button>
          <button
            type="button"
            onClick={() => router.push(`/preview/${id}`)}
            className="rounded-md border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 px-3 py-2 text-xs font-semibold text-[#1ECEFA]"
          >
            Publish settings
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            {PERIODS.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setPeriod(entry)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  period === entry
                    ? 'bg-[#1ECEFA] text-black'
                    : 'border border-white/10 text-slate-300 hover:bg-white/5'
                }`}
              >
                {entry === '7d'
                  ? '7 days'
                  : entry === '30d'
                    ? '30 days'
                    : '90 days'}
              </button>
            ))}
          </div>
        </div>

        {assetUrl ? (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
            Live URL:{' '}
            <a
              href={assetUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all font-semibold hover:underline"
            >
              {assetUrl}
            </a>
          </div>
        ) : null}

        {message ? (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-xl border border-white/10 bg-[#0C1118]"
              />
            ))}
          </div>
        ) : !data ? (
          <div className="rounded-xl border border-dashed border-white/20 bg-[#0C1118] p-10 text-center text-sm text-slate-400">
            No analytics data yet.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-white/10 bg-[#0C1118] p-4"
                >
                  <p className="text-2xl text-slate-100">{card.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[#0C1118] p-4">
                <h2 className="mb-3 text-sm font-semibold text-slate-100">Daily views</h2>
                <SparklineChart
                  data={data.dailyViews.map((row) => ({ label: row.date, value: row.count }))}
                  variant="area"
                  strokeColor="#1ECEFA"
                  fillColor="rgba(30,206,250,0.08)"
                  height={180}
                  showAxes
                  showTooltip
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0C1118] p-4">
                <h2 className="text-sm font-semibold text-slate-100">
                  Top sources
                </h2>
                {data.topSources.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">
                    No source data yet.
                  </p>
                ) : (
                  <div className="mt-3 grid gap-2">
                    {data.topSources.slice(0, 8).map((row) => (
                      <div key={row.source || 'direct'}>
                        <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="capitalize">
                            {row.source || 'direct'}
                          </span>
                          <span>{row.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10">
                          <div
                            className="h-1.5 rounded-full bg-emerald-400"
                            style={{
                              width: `${(row.count / maxSource) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0C1118] p-4">
              <h2 className="text-sm font-semibold text-slate-100">
                Short links
              </h2>
              <div className="mt-3 grid gap-2 lg:grid-cols-[180px_1fr_auto]">
                <input
                  value={newLinkSource}
                  onChange={(event) => setNewLinkSource(event.target.value)}
                  placeholder="Source label"
                  className="rounded-md border border-white/10 bg-[#0E141D] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                />
                <input
                  value={newLinkTarget}
                  onChange={(event) => setNewLinkTarget(event.target.value)}
                  placeholder="Target URL"
                  className="rounded-md border border-white/10 bg-[#0E141D] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#1ECEFA]/50"
                />
                <button
                  type="button"
                  onClick={() => void handleCreateLink()}
                  disabled={
                    creatingLink ||
                    !newLinkSource.trim() ||
                    !newLinkTarget.trim()
                  }
                  className="rounded-md bg-[#1ECEFA] px-3 py-2 text-xs font-semibold text-black disabled:opacity-60"
                >
                  {creatingLink ? 'Creating...' : 'Create'}
                </button>
              </div>

              {data.links.length === 0 ? (
                <p className="mt-3 text-xs text-slate-400">
                  No short links yet.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {data.links.map((link) => (
                    <div
                      key={link.id}
                      className="rounded-md border border-white/10 bg-[#0E141D] px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="break-all text-xs text-[#8CEBFF]">
                          {appBase}/s/{link.shortCode}
                        </span>
                        <span className="text-xs text-slate-300">
                          {link.clickCount} clicks
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Source: {(link.source ?? 'direct').toLowerCase()}
                      </p>
                      <p className="break-all text-[11px] text-slate-500">
                        {link.targetUrl}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </FeaturePage>
  );
}
