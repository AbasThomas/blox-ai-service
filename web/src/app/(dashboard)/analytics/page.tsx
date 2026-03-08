'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AssetType } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { analyticsApi, assetsApi } from '@/lib/api';
import { SparklineChart } from '@/components/analytics/SparklineChart';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Download,
  ExternalLink,
  Link as LinkIcon,
  MousePointerClick,
  Users,
} from '@/components/ui/icons';

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

interface DailyPoint { date: string; count: number; }
interface SourcePoint { source: string; count: number; }

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
  { id: '7d', days: 7, label: '7d' },
  { id: '30d', days: 30, label: '30d' },
  { id: '90d', days: 90, label: '90d' },
] as const;
type PeriodId = (typeof PERIODS)[number]['id'];

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
  return [...counts.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);
}

function buildDailyFromLinks(links: LinkTracker[]) {
  const counts = new Map<string, number>();
  links.forEach((link) => {
    const parsed = new Date(link.createdAt);
    if (Number.isNaN(parsed.getTime())) return;
    const day = parsed.toISOString().slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + Math.max(1, link.clickCount));
  });
  return [...counts.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => +new Date(a.date) - +new Date(b.date));
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
    ? legacyDaily.map((item) => ({ date: String(item.date ?? ''), count: asNumber(item.count, 0) }))
    : buildDailyFromLinks(linkRows);
  const legacyTopSources = Array.isArray(raw?.topSources) ? (raw.topSources as Array<Record<string, unknown>>) : [];
  const topSources = legacyTopSources.length > 0
    ? legacyTopSources.map((item) => ({ source: String(item.source ?? 'direct'), count: asNumber(item.count, 0) }))
    : buildSourceCounts(linkRows);
  const totalViews = asNumber(summary?.views, asNumber(raw?.totalViews, 0));
  const totalClicks = asNumber(summary?.clicks, asNumber(raw?.totalClicks, 0));
  const uniqueVisitors = asNumber(raw?.uniqueVisitors, Math.max(totalViews - Math.floor(totalClicks * 0.2), 0));
  return { assetId, totalViews, totalClicks, uniqueVisitors, dailyViews, topSources, links: linkRows };
}

function downloadFile(filename: string, content: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  URL.revokeObjectURL(url);
}

function toCsvRow(values: Array<string | number>) {
  return values.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',');
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
      if (assetRows.length > 0 && !selectedAssetId) setSelectedAssetId(assetRows[0].id);
      const analyticsRows = await Promise.all(
        assetRows.map(async (asset) => {
          try {
            const payload = await analyticsApi.getAssetAnalytics(asset.id, { from: fromDate.toISOString() });
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

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const assetMetrics = useMemo(() => {
    return assets.map((asset) => ({
      asset,
      metrics: analyticsByAsset[asset.id] ?? normalizeAnalyticsPayload(asset.id, {}),
    }));
  }, [assets, analyticsByAsset]);

  const globalSummary = useMemo(() => {
    return assetMetrics.reduce((acc, item) => {
      acc.views += item.metrics.totalViews;
      acc.clicks += item.metrics.totalClicks;
      acc.unique += item.metrics.uniqueVisitors;
      acc.links += item.metrics.links.length;
      return acc;
    }, { views: 0, clicks: 0, unique: 0, links: 0 });
  }, [assetMetrics]);

  const topSources = useMemo(() => {
    const counts = new Map<string, number>();
    assetMetrics.forEach((item) => {
      item.metrics.topSources.forEach((source) => {
        counts.set(source.source, (counts.get(source.source) ?? 0) + source.count);
      });
    });
    return [...counts.entries()].map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count).slice(0, 8);
  }, [assetMetrics]);

  const globalDailyViews = useMemo(() => {
    const counts = new Map<string, number>();
    assetMetrics.forEach((item) => {
      item.metrics.dailyViews.forEach(({ date, count }) => {
        counts.set(date, (counts.get(date) ?? 0) + count);
      });
    });
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ label: date, value: count }));
  }, [assetMetrics]);

  const allLinks = useMemo(() => {
    return assetMetrics.flatMap((item) =>
      item.metrics.links.map((link) => ({ ...link, assetTitle: item.asset.title, assetType: item.asset.type })),
    );
  }, [assetMetrics]);

  const heatmap = useMemo(() => {
    const rows = 7;
    const cols = 12;
    const matrix = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
    allLinks.forEach((link) => {
      const parsed = new Date(link.createdAt);
      if (Number.isNaN(parsed.getTime())) return;
      const day = (parsed.getDay() + 6) % 7;
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
      const created = await analyticsApi.createShortLink(selectedAssetId, newLinkSource.trim(), newLinkTarget.trim()) as LinkTracker;
      setAnalyticsByAsset((prev) => {
        const current = prev[selectedAssetId] ?? normalizeAnalyticsPayload(selectedAssetId, {});
        const nextLinks = [{ ...created, assetId: selectedAssetId }, ...current.links];
        return { ...prev, [selectedAssetId]: { ...current, links: nextLinks, topSources: buildSourceCounts(nextLinks), dailyViews: buildDailyFromLinks(nextLinks) } };
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
    const payload = { generatedAt: new Date().toISOString(), period, global: globalSummary, assets: sortedAssets.map((item) => ({ id: item.asset.id, title: item.asset.title, type: item.asset.type, ...item.metrics })), links: allLinks };
    downloadFile(`analytics-${period}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
  }, [allLinks, globalSummary, period, sortedAssets]);

  const handleExportOverviewCsv = useCallback(() => {
    const header = toCsvRow(['asset_id', 'asset_title', 'asset_type', 'total_views', 'total_clicks', 'unique_visitors', 'ctr', 'link_count']);
    const rows = sortedAssets.map((item) => toCsvRow([item.asset.id, item.asset.title, item.asset.type, item.metrics.totalViews, item.metrics.totalClicks, item.metrics.uniqueVisitors, percent(item.metrics.totalClicks, item.metrics.totalViews), item.metrics.links.length]));
    downloadFile(`analytics-overview-${period}.csv`, [header, ...rows].join('\n'), 'text/csv;charset=utf-8');
  }, [period, sortedAssets]);

  const handleExportLinksCsv = useCallback(() => {
    const header = toCsvRow(['asset_id', 'asset_title', 'asset_type', 'short_code', 'source', 'target_url', 'click_count', 'created_at']);
    const rows = allLinks.map((link) => toCsvRow([link.assetId, link.assetTitle, link.assetType, link.shortCode, link.source ?? '', link.targetUrl, link.clickCount, link.createdAt]));
    downloadFile(`analytics-links-${period}.csv`, [header, ...rows].join('\n'), 'text/csv;charset=utf-8');
  }, [allLinks, period]);

  return (
    <FeaturePage
      title="Analytics"
      description="Global analytics across all assets — views, clicks, heatmaps, link tracking, and exports."
    >
      <div className="space-y-6">
        {/* Period + export row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center h-8 rounded border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
            {PERIODS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPeriod(item.id)}
                className={`h-8 px-4 text-[12px] font-medium transition-colors border-r border-[#1B2131] last:border-r-0 ${
                  period === item.id ? 'bg-[#141C28] text-white' : 'text-[#46566A] hover:text-[#8899AA]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: 'JSON', action: handleExportJson },
              { label: 'Overview CSV', action: handleExportOverviewCsv },
              { label: 'Links CSV', action: handleExportLinksCsv },
            ].map((exp) => (
              <button
                key={exp.label}
                type="button"
                onClick={exp.action}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded border border-[#1B2131] text-[11px] text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] transition-colors"
              >
                <Download size={11} /> {exp.label}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className="rounded border border-[#1ECEFA]/20 bg-[#1ECEFA]/5 px-3 py-2 text-[12px] text-[#1ECEFA]">
            {message}
          </div>
        )}

        {/* Stat row */}
        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4 bg-[#1B2131] border border-[#1B2131] rounded-md overflow-hidden">
          {[
            { label: 'Total Views', value: globalSummary.views, icon: BarChart3, accent: 'bg-[#1ECEFA]' },
            { label: 'Total Clicks', value: globalSummary.clicks, icon: MousePointerClick, accent: 'bg-violet-500' },
            { label: 'Unique Visitors', value: globalSummary.unique, icon: Users, accent: 'bg-emerald-500' },
            { label: 'Tracked Links', value: globalSummary.links, icon: LinkIcon, accent: 'bg-amber-500' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="relative bg-[#0B0E14] px-5 py-4">
                <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${stat.accent}`} />
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] text-[#4E5C6E] uppercase tracking-wide">{stat.label}</p>
                  <Icon size={13} className="text-[#2E3847]" />
                </div>
                <p className="mt-2 text-2xl font-bold text-white tabular-nums">{stat.value.toLocaleString()}</p>
              </div>
            );
          })}
        </div>

        {/* Daily trend */}
        <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#1B2131] px-4 py-3">
            <Activity size={14} className="text-[#4E5C6E]" />
            <h2 className="text-[13px] font-semibold text-white">Daily Views Trend</h2>
            <span className="ml-auto text-[11px] text-[#3A4452]">Aggregated across all assets</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="h-[180px] animate-pulse rounded bg-[#0d1018]" />
            ) : (
              <SparklineChart
                data={globalDailyViews}
                variant="area"
                strokeColor="#1ECEFA"
                fillColor="rgba(30,206,250,0.06)"
                height={180}
                showAxes
                showTooltip
              />
            )}
          </div>
        </div>

        {/* Heatmap + Sources */}
        <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
          <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
            <div className="border-b border-[#1B2131] px-4 py-3">
              <h2 className="text-[13px] font-semibold text-white">Engagement Heatmap</h2>
              <p className="mt-0.5 text-[11px] text-[#4E5C6E]">Interaction intensity by weekday and 2-hour blocks</p>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="h-48 animate-pulse rounded bg-[#0d1018]" />
              ) : (
                <div className="space-y-1.5">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayIndex) => (
                    <div key={day} className="flex items-center gap-2">
                      <span className="w-7 font-mono text-[10px] text-[#3A4452] uppercase">{day}</span>
                      <div className="grid flex-1 grid-cols-12 gap-[3px]">
                        {heatmap.matrix[dayIndex].map((value, cellIndex) => {
                          const strength = heatmap.maxValue > 0 ? value / heatmap.maxValue : 0;
                          const alpha = value === 0 ? 0.05 : 0.15 + strength * 0.7;
                          return (
                            <div
                              key={`${day}-${cellIndex}`}
                              className="h-4 rounded-[2px]"
                              style={{ backgroundColor: `rgba(30, 206, 250, ${alpha})` }}
                              title={`${day} ${String(cellIndex * 2).padStart(2, '0')}:00 — ${value} interactions`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <p className="pt-1 text-[10px] text-[#3A4452]">Darker = higher intensity</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
            <div className="border-b border-[#1B2131] px-4 py-3">
              <h2 className="text-[13px] font-semibold text-white">Top Sources</h2>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-[#0d1018]" />)}
                </div>
              ) : topSources.length === 0 ? (
                <p className="text-[13px] text-[#4E5C6E]">No source data yet.</p>
              ) : (
                <div className="space-y-2">
                  {topSources.map((source) => {
                    const max = topSources[0]?.count ?? 1;
                    const width = `${Math.max(6, (source.count / max) * 100)}%`;
                    return (
                      <div key={source.source}>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-medium text-[#8899AA]">{source.source || 'direct'}</span>
                          <span className="font-mono text-[#4E5C6E]">{source.count}</span>
                        </div>
                        <div className="h-[3px] rounded-full bg-[#1B2131]">
                          <div className="h-[3px] rounded-full bg-[#1ECEFA]" style={{ width }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Per-asset table */}
        <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
          <div className="border-b border-[#1B2131] px-4 py-3">
            <h2 className="text-[13px] font-semibold text-white">Per-Asset Breakdown</h2>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="h-32 animate-pulse rounded bg-[#0d1018]" />
            ) : sortedAssets.length === 0 ? (
              <p className="text-[13px] text-[#4E5C6E]">No assets found yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-[#1B2131]">
                      {['Asset', 'Type', 'Views', 'Clicks', 'CTR', 'Links', ''].map((h) => (
                        <th key={h} className="px-3 py-2 font-mono text-[10px] uppercase text-[#3A4452] tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAssets.map((item) => (
                      <tr key={item.asset.id} className="border-b border-[#1B2131] last:border-b-0 hover:bg-[#0d1018] transition-colors">
                        <td className="px-3 py-2.5">
                          <p className="max-w-[220px] truncate text-[13px] font-medium text-white">{item.asset.title}</p>
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-[#4E5C6E]">{item.asset.type}</td>
                        <td className="px-3 py-2.5 font-mono text-[12px] text-[#8899AA]">{item.metrics.totalViews}</td>
                        <td className="px-3 py-2.5 font-mono text-[12px] text-[#8899AA]">{item.metrics.totalClicks}</td>
                        <td className="px-3 py-2.5 font-mono text-[12px] text-[#8899AA]">{percent(item.metrics.totalClicks, item.metrics.totalViews)}</td>
                        <td className="px-3 py-2.5 font-mono text-[12px] text-[#8899AA]">{item.metrics.links.length}</td>
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/analytics/${item.asset.id}`}
                            className="inline-flex items-center gap-1 h-6 px-2 rounded border border-[#1B2131] text-[11px] text-[#1ECEFA] hover:border-[#1ECEFA]/30 transition-colors"
                          >
                            Open <ExternalLink size={10} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Link Tracker */}
        <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
          <div className="border-b border-[#1B2131] px-4 py-3">
            <h2 className="text-[13px] font-semibold text-white">Link Tracker</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid gap-2 lg:grid-cols-[200px_1fr_1fr_auto]">
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="h-9 rounded border border-[#1B2131] bg-[#0d1018] px-3 text-[13px] text-white outline-none focus:border-[#2A3A50] transition-colors"
              >
                <option value="">Select asset</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>{asset.title}</option>
                ))}
              </select>
              <input
                value={newLinkSource}
                onChange={(e) => setNewLinkSource(e.target.value)}
                placeholder="Source (linkedin, email...)"
                className="h-9 rounded border border-[#1B2131] bg-[#0d1018] px-3 text-[13px] text-white placeholder-[#3A4452] outline-none focus:border-[#2A3A50] transition-colors"
              />
              <input
                value={newLinkTarget}
                onChange={(e) => setNewLinkTarget(e.target.value)}
                placeholder="Target URL (https://...)"
                className="h-9 rounded border border-[#1B2131] bg-[#0d1018] px-3 text-[13px] text-white placeholder-[#3A4452] outline-none focus:border-[#2A3A50] transition-colors"
              />
              <button
                type="button"
                onClick={handleCreateLink}
                disabled={creatingLink}
                className="inline-flex items-center justify-center h-9 px-4 rounded bg-[#1ECEFA] text-[#060810] text-[12px] font-bold hover:bg-[#3DD5FF] disabled:opacity-50 transition-colors"
              >
                {creatingLink ? 'Creating...' : 'Create'}
              </button>
            </div>

            <div className="max-h-72 space-y-2 overflow-y-auto">
              {allLinks.length === 0 ? (
                <p className="text-[13px] text-[#4E5C6E]">No tracked links yet.</p>
              ) : (
                allLinks
                  .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                  .slice(0, 100)
                  .map((link) => {
                    const shortUrl = `${shortBaseUrl}/s/${link.shortCode}`;
                    return (
                      <div key={link.id} className="rounded border border-[#1B2131] bg-[#0d1018] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <p className="text-[12px] font-medium text-white">{link.assetTitle}</p>
                          <span className="font-mono text-[10px] text-[#3A4452]">{formatDate(link.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-[#4E5C6E]">
                          {link.source ?? 'direct'} · <span className="text-[#8899AA]">{link.clickCount} clicks</span>
                        </p>
                        <p className="mt-1 truncate text-[11px] text-[#1ECEFA]">{shortUrl}</p>
                        <p className="truncate text-[11px] text-[#3A4452]">{link.targetUrl}</p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => copyText(shortUrl)}
                            className="h-6 px-2 rounded border border-[#1B2131] text-[10px] text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] transition-colors"
                          >
                            Copy
                          </button>
                          <a
                            href={link.targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 h-6 px-2 rounded border border-[#1B2131] text-[10px] text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] transition-colors"
                          >
                            Visit <ArrowUpRight size={9} />
                          </a>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
