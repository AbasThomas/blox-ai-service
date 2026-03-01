'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AssetType } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { analyticsApi, assetsApi } from '@/lib/api';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Download,
  ExternalLink,
  Link as LinkIcon,
  MousePointerClick,
  Users,
} from 'lucide-react';

interface AssetRow {
  id: string;
  title: string;
  type: AssetType;
  updatedAt: string;
}

interface LinkTracker {
  id: string;
  assetId: string;
  shortCode: string;
  source?: string;
  targetUrl: string;
  clickCount: number;
  createdAt: string;
}

interface DailyPoint {
  date: string;
  count: number;
}

interface SourcePoint {
  source: string;
  count: number;
}

interface AssetAnalytics {
  assetId: string;
  totalViews: number;
  totalClicks: number;
  uniqueVisitors: number;
  dailyViews: DailyPoint[];
  topSources: SourcePoint[];
  links: LinkTracker[];
}

const PERIODS = [
  { id: '7d', days: 7, label: '7 days' },
  { id: '30d', days: 30, label: '30 days' },
  { id: '90d', days: 90, label: '90 days' },
] as const;
type PeriodId = (typeof PERIODS)[number]['id'];

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString();
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return '0.0%';
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function buildSourceCounts(links: LinkTracker[]) {
  const counts = new Map<string, number>();
  links.forEach((link) => {
    const source = (link.source ?? 'direct').trim().toLowerCase() || 'direct';
    counts.set(source, (counts.get(source) ?? 0) + Math.max(1, link.clickCount));
  });
  return [...counts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

function buildDailyFromLinks(links: LinkTracker[]) {
  const counts = new Map<string, number>();
  links.forEach((link) => {
    const parsed = new Date(link.createdAt);
    if (Number.isNaN(parsed.getTime())) return;
    const day = parsed.toISOString().slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + Math.max(1, link.clickCount));
  });
  return [...counts.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

function normalizeAnalyticsPayload(assetId: string, payload: unknown): AssetAnalytics {
  const raw = payload as Record<string, unknown>;
  const summary = (raw?.summary as Record<string, unknown> | undefined) ?? null;

  const summaryLinks = Array.isArray(summary?.links) ? (summary?.links as Array<Record<string, unknown>>) : [];
  const rawLinks = Array.isArray(raw?.links) ? (raw?.links as Array<Record<string, unknown>>) : [];
  const linkRows = (summaryLinks.length > 0 ? summaryLinks : rawLinks).map((link) => ({
    id: String(link.id ?? crypto.randomUUID()),
    assetId: String(link.assetId ?? assetId),
    shortCode: String(link.shortCode ?? ''),
    source: typeof link.source === 'string' ? link.source : undefined,
    targetUrl: String(link.targetUrl ?? ''),
    clickCount: asNumber(link.clickCount, 0),
    createdAt: String(link.createdAt ?? new Date().toISOString()),
  }));

  const legacyDaily = Array.isArray(raw?.dailyViews) ? (raw.dailyViews as Array<Record<string, unknown>>) : [];
  const dailyViews = legacyDaily.length > 0
    ? legacyDaily.map((item) => ({
        date: String(item.date ?? ''),
        count: asNumber(item.count, 0),
      }))
    : buildDailyFromLinks(linkRows);

  const legacyTopSources = Array.isArray(raw?.topSources) ? (raw.topSources as Array<Record<string, unknown>>) : [];
  const topSources = legacyTopSources.length > 0
    ? legacyTopSources.map((item) => ({
        source: String(item.source ?? 'direct'),
        count: asNumber(item.count, 0),
      }))
    : buildSourceCounts(linkRows);

  const totalViews = asNumber(summary?.views, asNumber(raw?.totalViews, 0));
  const totalClicks = asNumber(summary?.clicks, asNumber(raw?.totalClicks, 0));
  const uniqueVisitors = asNumber(
    raw?.uniqueVisitors,
    Math.max(totalViews - Math.floor(totalClicks * 0.2), 0),
  );

  return {
    assetId,
    totalViews,
    totalClicks,
    uniqueVisitors,
    dailyViews,
    topSources,
    links: linkRows,
  };
}

function downloadFile(filename: string, content: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function toCsvRow(values: Array<string | number>) {
  return values
    .map((value) => `"${String(value).replaceAll('"', '""')}"`)
    .join(',');
}

export default function AnalyticsDashboardPage() {
  const [period, setPeriod] = useState<PeriodId>('30d');
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [analyticsByAsset, setAnalyticsByAsset] = useState<Record<string, AssetAnalytics>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [newLinkSource, setNewLinkSource] = useState('');
  const [newLinkTarget, setNewLinkTarget] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const periodDays = PERIODS.find((item) => item.id === period)?.days ?? 30;
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - periodDays);

      const assetRows = await assetsApi.list() as AssetRow[];
      setAssets(assetRows);
      if (assetRows.length > 0 && !selectedAssetId) {
        setSelectedAssetId(assetRows[0].id);
      }

      const analyticsRows = await Promise.all(
        assetRows.map(async (asset) => {
          try {
            const payload = await analyticsApi.getAssetAnalytics(asset.id, {
              from: fromDate.toISOString(),
            });
            return [asset.id, normalizeAnalyticsPayload(asset.id, payload)] as const;
          } catch {
            return [asset.id, normalizeAnalyticsPayload(asset.id, {})] as const;
          }
        }),
      );

      setAnalyticsByAsset(Object.fromEntries(analyticsRows));
    } catch (error) {
      setAssets([]);
      setAnalyticsByAsset({});
      setMessage(error instanceof Error ? error.message : 'Could not load analytics.');
    } finally {
      setLoading(false);
    }
  }, [period, selectedAssetId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const assetMetrics = useMemo(() => {
    return assets.map((asset) => ({
      asset,
      metrics: analyticsByAsset[asset.id] ?? normalizeAnalyticsPayload(asset.id, {}),
    }));
  }, [assets, analyticsByAsset]);

  const globalSummary = useMemo(() => {
    const totals = assetMetrics.reduce(
      (acc, item) => {
        acc.views += item.metrics.totalViews;
        acc.clicks += item.metrics.totalClicks;
        acc.unique += item.metrics.uniqueVisitors;
        acc.links += item.metrics.links.length;
        return acc;
      },
      { views: 0, clicks: 0, unique: 0, links: 0 },
    );
    return totals;
  }, [assetMetrics]);

  const topSources = useMemo(() => {
    const counts = new Map<string, number>();
    assetMetrics.forEach((item) => {
      item.metrics.topSources.forEach((source) => {
        counts.set(source.source, (counts.get(source.source) ?? 0) + source.count);
      });
    });
    return [...counts.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [assetMetrics]);

  const allLinks = useMemo(() => {
    return assetMetrics.flatMap((item) =>
      item.metrics.links.map((link) => ({
        ...link,
        assetTitle: item.asset.title,
        assetType: item.asset.type,
      })),
    );
  }, [assetMetrics]);

  const heatmap = useMemo(() => {
    const rows = 7;
    const cols = 12; // 2-hour buckets
    const matrix = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));

    allLinks.forEach((link) => {
      const parsed = new Date(link.createdAt);
      if (Number.isNaN(parsed.getTime())) return;
      const day = (parsed.getDay() + 6) % 7; // Monday first
      const hourBucket = Math.floor(parsed.getHours() / 2);
      matrix[day][hourBucket] += Math.max(1, link.clickCount);
    });

    const maxValue = matrix.flat().reduce((max, current) => Math.max(max, current), 0);
    return { matrix, maxValue };
  }, [allLinks]);

  const sortedAssets = useMemo(() => {
    return [...assetMetrics].sort((a, b) => b.metrics.totalViews - a.metrics.totalViews);
  }, [assetMetrics]);

  const shortBaseUrl = useMemo(() => {
    if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_APP_BASE_URL ?? '';
    return process.env.NEXT_PUBLIC_APP_BASE_URL ?? window.location.origin;
  }, []);

  const copyText = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage('Copied short link.');
    } catch {
      setMessage('Could not copy link.');
    }
  }, []);

  const handleCreateLink = useCallback(async () => {
    if (!selectedAssetId || !newLinkSource.trim() || !newLinkTarget.trim()) {
      setMessage('Select an asset and fill source + target URL.');
      return;
    }

    setCreatingLink(true);
    setMessage('');
    try {
      const created = await analyticsApi.createShortLink(
        selectedAssetId,
        newLinkSource.trim(),
        newLinkTarget.trim(),
      ) as LinkTracker;

      setAnalyticsByAsset((prev) => {
        const current = prev[selectedAssetId] ?? normalizeAnalyticsPayload(selectedAssetId, {});
        const nextLinks = [
          {
            ...created,
            assetId: selectedAssetId,
          },
          ...current.links,
        ];
        const nextTopSources = buildSourceCounts(nextLinks);
        const nextDaily = buildDailyFromLinks(nextLinks);

        return {
          ...prev,
          [selectedAssetId]: {
            ...current,
            links: nextLinks,
            topSources: nextTopSources,
            dailyViews: nextDaily,
          },
        };
      });

      setNewLinkSource('');
      setNewLinkTarget('');
      setMessage('Short link created.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create short link.');
    } finally {
      setCreatingLink(false);
    }
  }, [newLinkSource, newLinkTarget, selectedAssetId]);

  const handleExportJson = useCallback(() => {
    const payload = {
      generatedAt: new Date().toISOString(),
      period,
      global: globalSummary,
      assets: sortedAssets.map((item) => ({
        id: item.asset.id,
        title: item.asset.title,
        type: item.asset.type,
        ...item.metrics,
      })),
      links: allLinks,
    };
    downloadFile(`analytics-${period}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
  }, [allLinks, globalSummary, period, sortedAssets]);

  const handleExportOverviewCsv = useCallback(() => {
    const header = toCsvRow([
      'asset_id',
      'asset_title',
      'asset_type',
      'total_views',
      'total_clicks',
      'unique_visitors',
      'ctr',
      'link_count',
    ]);
    const rows = sortedAssets.map((item) =>
      toCsvRow([
        item.asset.id,
        item.asset.title,
        item.asset.type,
        item.metrics.totalViews,
        item.metrics.totalClicks,
        item.metrics.uniqueVisitors,
        percent(item.metrics.totalClicks, item.metrics.totalViews),
        item.metrics.links.length,
      ]),
    );
    downloadFile(`analytics-overview-${period}.csv`, [header, ...rows].join('\n'), 'text/csv;charset=utf-8');
  }, [period, sortedAssets]);

  const handleExportLinksCsv = useCallback(() => {
    const header = toCsvRow([
      'asset_id',
      'asset_title',
      'asset_type',
      'short_code',
      'source',
      'target_url',
      'click_count',
      'created_at',
    ]);
    const rows = allLinks.map((link) =>
      toCsvRow([
        link.assetId,
        link.assetTitle,
        link.assetType,
        link.shortCode,
        link.source ?? '',
        link.targetUrl,
        link.clickCount,
        link.createdAt,
      ]),
    );
    downloadFile(`analytics-links-${period}.csv`, [header, ...rows].join('\n'), 'text/csv;charset=utf-8');
  }, [allLinks, period]);

  return (
    <FeaturePage
      title="Analytics"
      description="Global analytics overview across all assets with per-asset deep dives, heatmaps, link tracking, and exports."
      headerIcon={<Activity className="h-6 w-6" />}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPeriod(item.id)}
                className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                  period === item.id
                    ? 'border border-[#1ECEFA]/40 bg-[#1ECEFA]/10 text-[#1ECEFA]'
                    : 'border border-white/10 bg-black/20 text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-[#1ECEFA]/40 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" /> Export JSON
            </button>
            <button
              type="button"
              onClick={handleExportOverviewCsv}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-[#1ECEFA]/40 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" /> Export Overview CSV
            </button>
            <button
              type="button"
              onClick={handleExportLinksCsv}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-[#1ECEFA]/40 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" /> Export Links CSV
            </button>
          </div>
        </div>

        {message ? (
          <div className="rounded-lg border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 px-3 py-2 text-xs text-[#1ECEFA]">
            {message}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Views', value: globalSummary.views, icon: BarChart3 },
            { label: 'Total Clicks', value: globalSummary.clicks, icon: MousePointerClick },
            { label: 'Unique Visitors', value: globalSummary.unique, icon: Users },
            { label: 'Tracked Links', value: globalSummary.links, icon: LinkIcon },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</p>
                  <Icon className="h-4 w-4 text-[#1ECEFA]" />
                </div>
                <p className="text-2xl font-black text-white">{stat.value.toLocaleString()}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1ECEFA]">Engagement Heatmap</h2>
            <p className="mb-4 text-xs text-slate-400">Interaction intensity by weekday and 2-hour time blocks.</p>

            {loading ? (
              <div className="h-48 animate-pulse rounded-xl bg-white/5" />
            ) : (
              <div className="space-y-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayIndex) => (
                  <div key={day} className="flex items-center gap-2">
                    <span className="w-8 text-[10px] font-bold uppercase text-slate-500">{day}</span>
                    <div className="grid flex-1 grid-cols-12 gap-1">
                      {heatmap.matrix[dayIndex].map((value, cellIndex) => {
                        const strength = heatmap.maxValue > 0 ? value / heatmap.maxValue : 0;
                        const alpha = value === 0 ? 0.08 : 0.2 + strength * 0.75;
                        return (
                          <div
                            key={`${day}-${cellIndex}`}
                            className="h-4 rounded-[3px] border border-white/5"
                            style={{ backgroundColor: `rgba(30, 206, 250, ${alpha})` }}
                            title={`${day} ${String(cellIndex * 2).padStart(2, '0')}:00 - ${value} interactions`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="pt-2 text-[10px] text-slate-500">Low to high intensity from left to right color strength.</div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1ECEFA]">Top Sources</h2>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 animate-pulse rounded bg-white/5" />
                <div className="h-8 animate-pulse rounded bg-white/5" />
              </div>
            ) : topSources.length === 0 ? (
              <p className="text-sm text-slate-400">No source data yet.</p>
            ) : (
              <div className="space-y-2">
                {topSources.map((source) => {
                  const max = topSources[0]?.count ?? 1;
                  const width = `${Math.max(6, (source.count / max) * 100)}%`;
                  return (
                    <div key={source.source} className="rounded-lg border border-white/10 bg-[#0d151d] p-2">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{source.source || 'direct'}</span>
                        <span className="text-slate-400">{source.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10">
                        <div className="h-1.5 rounded-full bg-[#1ECEFA]" style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1ECEFA]">
            Per-Asset Deep Dive
          </h2>
          <p className="mb-4 text-xs text-slate-400">
            Open detailed analytics for each portfolio/resume/cover letter.
          </p>

          {loading ? (
            <div className="h-36 animate-pulse rounded-xl bg-white/5" />
          ) : sortedAssets.length === 0 ? (
            <p className="text-sm text-slate-400">No assets found yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-slate-500">
                    <th className="px-2 py-2">Asset</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Views</th>
                    <th className="px-2 py-2">Clicks</th>
                    <th className="px-2 py-2">CTR</th>
                    <th className="px-2 py-2">Links</th>
                    <th className="px-2 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAssets.map((item) => (
                    <tr key={item.asset.id} className="border-b border-white/5 text-slate-300">
                      <td className="px-2 py-3">
                        <div className="max-w-[260px] truncate font-semibold text-white">{item.asset.title}</div>
                      </td>
                      <td className="px-2 py-3 text-xs">{item.asset.type}</td>
                      <td className="px-2 py-3">{item.metrics.totalViews}</td>
                      <td className="px-2 py-3">{item.metrics.totalClicks}</td>
                      <td className="px-2 py-3">{percent(item.metrics.totalClicks, item.metrics.totalViews)}</td>
                      <td className="px-2 py-3">{item.metrics.links.length}</td>
                      <td className="px-2 py-3">
                        <Link
                          href={`/analytics/${item.asset.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs font-bold text-[#1ECEFA] hover:border-[#1ECEFA]/40"
                        >
                          Open
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1ECEFA]">Link Tracker</h2>
          <div className="grid gap-2 lg:grid-cols-[220px_1fr_1fr_auto]">
            <select
              value={selectedAssetId}
              onChange={(event) => setSelectedAssetId(event.target.value)}
              className="rounded-lg border border-white/10 bg-[#0d151d] px-3 py-2 text-sm text-white outline-none focus:border-[#1ECEFA]/40"
            >
              <option value="">Select asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.title}
                </option>
              ))}
            </select>
            <input
              value={newLinkSource}
              onChange={(event) => setNewLinkSource(event.target.value)}
              placeholder="Source (linkedin, email, twitter...)"
              className="rounded-lg border border-white/10 bg-[#0d151d] px-3 py-2 text-sm text-white outline-none focus:border-[#1ECEFA]/40"
            />
            <input
              value={newLinkTarget}
              onChange={(event) => setNewLinkTarget(event.target.value)}
              placeholder="Target URL (https://...)"
              className="rounded-lg border border-white/10 bg-[#0d151d] px-3 py-2 text-sm text-white outline-none focus:border-[#1ECEFA]/40"
            />
            <button
              type="button"
              onClick={handleCreateLink}
              disabled={creatingLink}
              className="inline-flex items-center justify-center rounded-lg border border-[#1ECEFA]/40 bg-[#1ECEFA]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#1ECEFA] hover:bg-[#1ECEFA]/20 disabled:opacity-50"
            >
              {creatingLink ? 'Creating...' : 'Create'}
            </button>
          </div>

          <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
            {allLinks.length === 0 ? (
              <p className="text-sm text-slate-400">No tracked links yet.</p>
            ) : (
              allLinks
                .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                .slice(0, 100)
                .map((link) => {
                  const shortUrl = `${shortBaseUrl}/s/${link.shortCode}`;
                  return (
                    <div key={link.id} className="rounded-xl border border-white/10 bg-[#0d151d] p-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-white">{link.assetTitle}</p>
                        <span className="text-slate-500">{formatDate(link.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-slate-400">
                        Source: <span className="text-slate-300">{link.source ?? 'direct'}</span> • Clicks:{' '}
                        <span className="text-slate-300">{link.clickCount}</span>
                      </p>
                      <p className="mt-1 truncate text-[#1ECEFA]">{shortUrl}</p>
                      <p className="truncate text-slate-500">{link.targetUrl}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyText(shortUrl)}
                          className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:border-[#1ECEFA]/40"
                        >
                          Copy
                        </button>
                        <a
                          href={link.targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:border-[#1ECEFA]/40"
                        >
                          Visit <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </section>
      </div>
    </FeaturePage>
  );
}
