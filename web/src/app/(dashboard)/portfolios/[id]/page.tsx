'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { assetsApi, analyticsApi, publishApi } from '@/lib/api';
import {
  X,
  Globe,
  ArrowUpRight,
  BarChart3,
  Settings,
  Sparkles,
  RotateCcw,
  BriefcaseBusiness,
  CheckCircle,
} from '@/components/ui/icons';

type Tab = 'overview' | 'edit' | 'publish' | 'analytics' | 'share' | 'settings';

const TABS: Array<{ id: Tab; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }> = [
  { id: 'overview', label: 'Overview', Icon: Globe },
  { id: 'edit', label: 'Edit', Icon: Sparkles },
  { id: 'publish', label: 'Publish', Icon: ArrowUpRight },
  { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
  { id: 'share', label: 'Share', Icon: Globe },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

function normalizeSubdomain(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function resolvePublicUrl(publishedUrl: string | null | undefined, subdomain: string): string {
  if (typeof window === 'undefined') return '';
  if (!publishedUrl && !subdomain) return '';
  if (!publishedUrl) return `${window.location.origin}/${subdomain}`;
  try {
    const parsed = new URL(publishedUrl);
    const isLocal =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname.endsWith('.localhost');
    if (isLocal && subdomain) return `${window.location.origin}/${subdomain}`;
    return parsed.toString();
  } catch {
    return subdomain ? `${window.location.origin}/${subdomain}` : (publishedUrl ?? '');
  }
}

export default function PortfolioDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [asset, setAsset] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const [subdomain, setSubdomain] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState('');
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const loadAsset = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await assetsApi.getById(params.id)) as Record<string, unknown>;
      setAsset(data);
      const slug = typeof data.slug === 'string' ? data.slug : '';
      const title = typeof data.title === 'string' ? data.title : '';
      const seeded = normalizeSubdomain(slug || title);
      if (seeded) setSubdomain(seeded);
      if (typeof data.publishedUrl === 'string') setPublishedUrl(data.publishedUrl);
    } catch {
      setAsset(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const data = (await analyticsApi.getAssetAnalytics(params.id)) as Record<string, unknown>;
      setAnalytics(data);
    } catch {
      setAnalytics({});
    } finally {
      setAnalyticsLoading(false);
    }
  }, [params.id]);

  useEffect(() => { void loadAsset(); }, [loadAsset]);
  useEffect(() => { if (activeTab === 'analytics') void loadAnalytics(); }, [activeTab, loadAnalytics]);

  const isLive = !!publishedUrl;
  const title = typeof asset?.title === 'string' ? asset.title : 'Portfolio';
  const updatedAt = typeof asset?.updatedAt === 'string' ? asset.updatedAt : '';
  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  const publicUrl = useMemo(() => resolvePublicUrl(publishedUrl, subdomain), [publishedUrl, subdomain]);

  const handlePublish = async () => {
    const normalized = normalizeSubdomain(subdomain);
    if (!normalized) { setPublishMsg('Enter a valid subdomain.'); return; }
    setPublishing(true);
    setPublishMsg('');
    try {
      const res = (await publishApi.publish({ assetId: params.id, subdomain: normalized })) as Record<string, unknown>;
      const newSub = normalizeSubdomain((res.subdomain as string) ?? normalized);
      setSubdomain(newSub);
      if (typeof res.publishedUrl === 'string') setPublishedUrl(res.publishedUrl);
      await loadAsset();
      setPublishMsg(res.status === 'scheduled' ? 'Publish scheduled.' : 'Published successfully!');
    } catch (error) {
      setPublishMsg(error instanceof Error ? error.message : 'Publish failed.');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!window.confirm('Unpublish this portfolio?')) return;
    setUnpublishing(true);
    setPublishMsg('');
    try {
      await publishApi.unpublish(params.id);
      setPublishedUrl(null);
      await loadAsset();
      setPublishMsg('Unpublished successfully.');
    } catch (error) {
      setPublishMsg(error instanceof Error ? error.message : 'Unpublish failed.');
    } finally {
      setUnpublishing(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    setActionMsg('');
    try {
      await assetsApi.duplicate(params.id);
      setActionMsg('Portfolio duplicated. Check your portfolios list.');
    } catch (error) {
      setActionMsg(error instanceof Error ? error.message : 'Could not duplicate.');
    } finally {
      setDuplicating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) return;
    setDeleting(true);
    setActionMsg('');
    try {
      await assetsApi.delete(params.id);
      router.push('/portfolios');
    } catch (error) {
      setActionMsg(error instanceof Error ? error.message : 'Could not delete.');
      setDeleting(false);
    }
  };

  const handleCopyUrl = () => {
    if (!publicUrl) return;
    void navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-0 -mx-4 -mt-8 sm:-mx-6 lg:-mx-8">
      {/* Header bar */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0C0F13]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-3">
          <button
            type="button"
            onClick={() => router.push('/portfolios')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            ← All Portfolios
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <BriefcaseBusiness className="h-4 w-4 shrink-0 text-[#1ECEFA]" />
            {loading ? (
              <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
            ) : (
              <h1 className="truncate text-sm font-semibold text-white">{title}</h1>
            )}
            <span
              className={`hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                isLive
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-600/30 bg-slate-600/10 text-slate-400'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              {isLive ? 'Live' : 'Draft'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/portfolios/${params.id}/edit`)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#1ECEFA] px-3 py-1.5 text-xs font-semibold text-[#0C0F13] hover:bg-white transition-colors"
          >
            Open Editor <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Tab navbar */}
        <div className="border-t border-white/5 bg-[#0d0d16] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div
            className="flex items-center gap-1 overflow-x-auto py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="h-20 animate-pulse rounded-xl bg-white/5" />
              <div className="h-20 animate-pulse rounded-xl bg-white/5" />
            </div>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* ── Overview ── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#1ECEFA]/6 via-[#0C0F13] to-purple-500/8 aspect-video max-h-80">
                  <div className="absolute inset-0 flex flex-col">
                    <div className="h-7 border-b border-white/5 bg-white/[0.03] flex items-center gap-1.5 px-3 shrink-0">
                      <span className="h-2 w-2 rounded-full bg-red-500/40" />
                      <span className="h-2 w-2 rounded-full bg-amber-500/40" />
                      <span className="h-2 w-2 rounded-full bg-emerald-500/40" />
                      <div className="ml-2 h-3.5 w-40 rounded-full bg-white/5" />
                    </div>
                    <div className="flex-1 p-6 space-y-3">
                      <div className="h-5 w-2/3 rounded-full bg-white/10" />
                      <div className="h-3 w-1/2 rounded-full bg-white/6" />
                      <div className="mt-4 space-y-2">
                        <div className="h-2.5 w-full rounded-full bg-white/5" />
                        <div className="h-2.5 w-5/6 rounded-full bg-white/5" />
                        <div className="h-2.5 w-4/6 rounded-full bg-white/5" />
                      </div>
                      <div className="mt-4 flex gap-3">
                        <div className="h-8 w-24 rounded-lg bg-white/8" />
                        <div className="h-8 w-20 rounded-lg bg-white/5" />
                      </div>
                    </div>
                  </div>
                  {isLive && publicUrl && (
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute top-10 right-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 backdrop-blur-sm hover:bg-emerald-500/20 transition-colors"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Live preview
                    </a>
                  )}
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="text-xs text-slate-500">Status</p>
                    <p className={`mt-1 text-sm font-semibold ${isLive ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {isLive ? 'Live' : 'Draft'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="text-xs text-slate-500">Last Updated</p>
                    <p className="mt-1 text-sm font-semibold text-slate-300">{formattedDate || '—'}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="text-xs text-slate-500">Visibility</p>
                    <p className="mt-1 text-sm font-semibold text-slate-300">{isLive ? 'Public' : 'Hidden'}</p>
                  </div>
                </div>

                {isLive && publicUrl && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-xs text-slate-400 mb-1">Public URL</p>
                    <a href={publicUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-300 break-all hover:underline">
                      {publicUrl}
                    </a>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/portfolios/${params.id}/edit`)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1ECEFA] px-5 py-2.5 text-sm font-semibold text-[#0C0F13] hover:bg-white transition-colors"
                  >
                    Open Editor <ArrowUpRight className="h-4 w-4" />
                  </button>
                  {isLive && publicUrl && (
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors"
                    >
                      View Live <Globe className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab('publish')}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    {isLive ? 'Republish' : 'Publish Now'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Edit ── */}
            {activeTab === 'edit' && (
              <div className="space-y-5">
                <p className="text-sm text-slate-400">
                  Open the full editor to update content, run AI optimizations, manage sections, and preview changes.
                </p>
                <button
                  type="button"
                  onClick={() => router.push(`/portfolios/${params.id}/edit`)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1ECEFA] px-5 py-3 text-sm font-semibold text-[#0C0F13] hover:bg-white transition-colors"
                >
                  Open Full Editor <ArrowUpRight className="h-4 w-4" />
                </button>

                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Hero & About', desc: 'Edit headline and bio', color: 'bg-blue-500/10 text-blue-400' },
                    { label: 'Projects', desc: 'Add or manage projects', color: 'bg-purple-500/10 text-purple-400' },
                    { label: 'Skills & Experience', desc: 'Update your stack', color: 'bg-emerald-500/10 text-emerald-400' },
                    { label: 'AI Optimize', desc: 'Regenerate with AI', color: 'bg-amber-500/10 text-amber-400' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => router.push(`/portfolios/${params.id}/edit`)}
                      className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left hover:bg-white/5 transition-colors group"
                    >
                      <div className={`flex h-8 w-8 shrink-0 mt-0.5 items-center justify-center rounded-lg ${item.color}`}>
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{item.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Publish ── */}
            {activeTab === 'publish' && (
              <div className="max-w-lg space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Subdomain</label>
                  <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    <input
                      value={subdomain}
                      onChange={(e) => setSubdomain(normalizeSubdomain(e.target.value))}
                      placeholder="my-portfolio"
                      className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600"
                    />
                    <span className="flex items-center border-l border-white/10 px-3 text-xs text-slate-500 whitespace-nowrap">
                      .blox.app
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handlePublish()}
                  disabled={publishing}
                  className="w-full rounded-xl bg-[#1ECEFA] px-4 py-3 text-sm font-semibold text-[#0C0F13] hover:bg-white disabled:opacity-60 transition-colors"
                >
                  {publishing ? 'Publishing...' : isLive ? 'Republish' : 'Publish Now'}
                </button>

                {isLive && (
                  <button
                    type="button"
                    onClick={() => void handleUnpublish()}
                    disabled={unpublishing}
                    className="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-60 transition-colors"
                  >
                    {unpublishing ? 'Unpublishing...' : 'Unpublish'}
                  </button>
                )}

                {publishMsg && (
                  <p className={`text-sm ${publishMsg.includes('success') || publishMsg.includes('scheduled') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {publishMsg}
                  </p>
                )}

                {publicUrl && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-xs text-slate-400 mb-1">Public URL</p>
                    <a href={publicUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-300 break-all hover:underline">
                      {publicUrl}
                    </a>
                  </div>
                )}

                <div className="border-t border-white/5 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push(`/preview/${params.id}`)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                  >
                    Advanced publish & SEO settings <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Analytics ── */}
            {activeTab === 'analytics' && (
              <div className="space-y-5">
                {analyticsLoading ? (
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />
                    ))}
                  </div>
                ) : analytics ? (
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Total Views', value: (analytics.totalViews as number | undefined) ?? 0 },
                      { label: 'Unique Visitors', value: (analytics.uniqueVisitors as number | undefined) ?? 0 },
                      { label: 'Avg. Time on Page', value: typeof analytics.avgTimeOnPage === 'number' ? `${analytics.avgTimeOnPage}s` : '—' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                        <p className="text-xs text-slate-500">{stat.label}</p>
                        <p className="mt-2 text-3xl font-bold text-white">{String(stat.value)}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => router.push(`/analytics/${params.id}`)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
                >
                  Open Full Analytics <BarChart3 className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ── Share ── */}
            {activeTab === 'share' && (
              <div className="max-w-lg space-y-5">
                {publicUrl ? (
                  <>
                    <p className="text-sm text-slate-400">Share your live portfolio with anyone.</p>
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 overflow-hidden">
                      <span className="flex-1 text-sm text-slate-300 truncate min-w-0">{publicUrl}</span>
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                          copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {copied ? <><CheckCircle className="h-3.5 w-3.5" /> Copied</> : 'Copy Link'}
                      </button>
                    </div>
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
                    >
                      Open in New Tab <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </>
                ) : (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                    <p className="text-sm font-medium text-amber-300 mb-1">Portfolio is not published yet</p>
                    <p className="text-xs text-amber-400/70 mb-4">Publish your portfolio to get a shareable public link.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('publish')}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors"
                    >
                      Go to Publish <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Settings ── */}
            {activeTab === 'settings' && (
              <div className="max-w-lg space-y-4">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
                  <p className="text-sm font-medium text-slate-300 mb-4">Actions</p>

                  <button
                    type="button"
                    onClick={() => void handleDuplicate()}
                    disabled={duplicating}
                    className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10 transition-colors disabled:opacity-60 group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                        {duplicating ? 'Duplicating...' : 'Duplicate Portfolio'}
                      </p>
                      <p className="text-xs text-slate-500">Create a copy of this portfolio</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push(`/preview/${params.id}`)}
                    className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                      <Globe className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Publish & SEO Settings</p>
                      <p className="text-xs text-slate-500">Template, subdomain, and SEO metadata</p>
                    </div>
                  </button>
                </div>

                <div className="rounded-2xl border border-rose-500/10 bg-rose-500/[0.04] p-5">
                  <p className="text-sm font-medium text-rose-400 mb-4">Danger Zone</p>
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                    className="w-full flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-left hover:bg-rose-500/20 transition-colors disabled:opacity-60 group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                      <X className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-rose-300">{deleting ? 'Deleting...' : 'Delete Portfolio'}</p>
                      <p className="text-xs text-rose-400/50">This action cannot be undone</p>
                    </div>
                  </button>
                </div>

                {actionMsg && (
                  <p className={`text-sm ${actionMsg.includes('success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {actionMsg}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
