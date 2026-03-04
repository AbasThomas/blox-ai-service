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
  Link as LinkIcon,
  CheckCircle,
} from '@/components/ui/icons';

type ModalTab = 'overview' | 'edit' | 'publish' | 'analytics' | 'share' | 'settings';

export interface PortfolioModalAsset {
  id: string;
  title: string;
  publishedUrl?: string | null;
  updatedAt: string;
  healthScore?: number | null;
}

interface Props {
  portfolio: PortfolioModalAsset;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onDuplicated?: () => void;
}

const TABS: Array<{ id: ModalTab; label: string; Icon: React.FC<any> }> = [
  { id: 'overview', label: 'Overview', Icon: Globe },
  { id: 'edit', label: 'Edit', Icon: Sparkles },
  { id: 'publish', label: 'Publish', Icon: ArrowUpRight },
  { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
  { id: 'share', label: 'Share', Icon: LinkIcon },
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

export function PortfolioDetailModal({ portfolio, onClose, onDeleted, onDuplicated }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ModalTab>('overview');
  const [fullAsset, setFullAsset] = useState<Record<string, unknown> | null>(null);

  // Publish state
  const [subdomain, setSubdomain] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState('');
  const [currentPublishedUrl, setCurrentPublishedUrl] = useState<string | null>(
    portfolio.publishedUrl ?? null,
  );

  // Analytics
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Settings
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const isLive = !!currentPublishedUrl;

  const loadAsset = useCallback(async () => {
    try {
      const data = (await assetsApi.getById(portfolio.id)) as Record<string, unknown>;
      setFullAsset(data);
      const slug = typeof data.slug === 'string' ? data.slug : '';
      const seeded = normalizeSubdomain(slug || portfolio.title);
      if (seeded) setSubdomain(seeded);
      if (typeof data.publishedUrl === 'string') {
        setCurrentPublishedUrl(data.publishedUrl);
      }
    } catch {
      // ignore
    }
  }, [portfolio.id, portfolio.title]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const data = (await analyticsApi.getAssetAnalytics(portfolio.id)) as Record<string, unknown>;
      setAnalytics(data);
    } catch {
      setAnalytics({});
    } finally {
      setAnalyticsLoading(false);
    }
  }, [portfolio.id]);

  useEffect(() => {
    void loadAsset();
  }, [loadAsset]);

  useEffect(() => {
    if (activeTab === 'analytics') void loadAnalytics();
  }, [activeTab, loadAnalytics]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const publicUrl = useMemo(
    () => resolvePublicUrl(currentPublishedUrl, subdomain),
    [currentPublishedUrl, subdomain],
  );

  const formattedDate = new Date(portfolio.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handlePublish = async () => {
    const normalized = normalizeSubdomain(subdomain);
    if (!normalized) {
      setPublishMsg('Enter a valid subdomain.');
      return;
    }
    setPublishing(true);
    setPublishMsg('');
    try {
      const res = (await publishApi.publish({ assetId: portfolio.id, subdomain: normalized })) as Record<string, unknown>;
      const newSub = normalizeSubdomain((res.subdomain as string) ?? normalized);
      setSubdomain(newSub);
      if (typeof res.publishedUrl === 'string') setCurrentPublishedUrl(res.publishedUrl);
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
      await publishApi.unpublish(portfolio.id);
      setCurrentPublishedUrl(null);
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
      await assetsApi.duplicate(portfolio.id);
      setActionMsg('Portfolio duplicated successfully.');
      onDuplicated?.();
    } catch (error) {
      setActionMsg(error instanceof Error ? error.message : 'Could not duplicate.');
    } finally {
      setDuplicating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${portfolio.title}"? This action cannot be undone.`)) return;
    setDeleting(true);
    setActionMsg('');
    try {
      await assetsApi.delete(portfolio.id);
      onDeleted(portfolio.id);
      onClose();
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 48, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 48, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        role="dialog"
        aria-modal="true"
        aria-label={portfolio.title}
        className="relative z-10 w-full sm:max-w-3xl flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-[#0C0F13] border border-white/10 max-h-[92dvh] sm:max-h-[88dvh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1ECEFA]/10 text-[#1ECEFA]">
              <BriefcaseBusiness className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">{portfolio.title}</h2>
              <p className="text-xs text-slate-500">Updated {formattedDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                isLive
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-600/30 bg-slate-600/10 text-slate-400'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-slate-500'}`}
              />
              {isLive ? 'Live' : 'Draft'}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Navbar */}
        <div className="bg-[#0d0d16] border-b border-white/5 px-4 py-2.5">
          <div
            className="flex items-center gap-1 overflow-x-auto"
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

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Browser preview mockup */}
              <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#1ECEFA]/8 via-[#0C0F13] to-purple-500/8 aspect-video">
                <div className="absolute inset-0 flex flex-col">
                  <div className="h-7 border-b border-white/5 bg-white/[0.03] flex items-center gap-1.5 px-3 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-red-500/40" />
                    <span className="h-2 w-2 rounded-full bg-amber-500/40" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500/40" />
                    <div className="ml-2 flex-1 max-w-40 h-3.5 rounded-full bg-white/5" />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <Globe className="h-16 w-16 text-white/8" strokeWidth={0.5} />
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-1">
                  <p className="text-xs text-slate-500">Status</p>
                  <p className={`text-sm font-semibold ${isLive ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {isLive ? 'Live' : 'Draft'}
                  </p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-1">
                  <p className="text-xs text-slate-500">Last Updated</p>
                  <p className="text-sm font-semibold text-slate-300">{formattedDate}</p>
                </div>
                {isLive && publicUrl && (
                  <div className="sm:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-1">
                    <p className="text-xs text-slate-500">Public URL</p>
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-[#1ECEFA] hover:underline break-all"
                    >
                      {publicUrl}
                    </a>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => router.push(`/portfolios/${portfolio.id}/edit`)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1ECEFA] px-4 py-2.5 text-sm font-semibold text-[#0C0F13] hover:bg-white transition-colors"
                >
                  Open Editor <ArrowUpRight className="h-4 w-4" />
                </button>
                {isLive && publicUrl && (
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    View Live <Globe className="h-4 w-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => router.push(`/analytics/${portfolio.id}`)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors"
                >
                  Analytics <BarChart3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Edit ── */}
          {activeTab === 'edit' && (
            <div className="space-y-5">
              <p className="text-sm text-slate-400">
                Open the full editor to update content, run AI optimizations, manage sections, and preview changes in real time.
              </p>
              <button
                type="button"
                onClick={() => router.push(`/portfolios/${portfolio.id}/edit`)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1ECEFA] px-5 py-3 text-sm font-semibold text-[#0C0F13] hover:bg-white transition-colors"
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
                    onClick={() => router.push(`/portfolios/${portfolio.id}/edit`)}
                    className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left hover:bg-white/5 transition-colors group"
                  >
                    <div className={`flex h-8 w-8 shrink-0 mt-0.5 items-center justify-center rounded-lg ${item.color}`}>
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Publish ── */}
          {activeTab === 'publish' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Subdomain
                </label>
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
                className="w-full rounded-xl bg-[#1ECEFA] px-4 py-2.5 text-sm font-semibold text-[#0C0F13] transition-colors hover:bg-white disabled:opacity-60"
              >
                {publishing ? 'Publishing...' : isLive ? 'Republish' : 'Publish Now'}
              </button>

              {isLive && (
                <button
                  type="button"
                  onClick={() => void handleUnpublish()}
                  disabled={unpublishing}
                  className="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-60"
                >
                  {unpublishing ? 'Unpublishing...' : 'Unpublish'}
                </button>
              )}

              {publishMsg && (
                <p
                  className={`text-sm ${
                    publishMsg.includes('success') || publishMsg.includes('scheduled')
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {publishMsg}
                </p>
              )}

              {publicUrl && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-xs text-slate-400 mb-1">Public URL</p>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-emerald-300 break-all hover:underline"
                  >
                    {publicUrl}
                  </a>
                </div>
              )}

              <div className="border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => router.push(`/preview/${portfolio.id}`)}
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
                <div className="flex h-40 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02]">
                  <p className="text-sm text-slate-500">Loading analytics...</p>
                </div>
              ) : analytics ? (
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Total Views', value: (analytics.totalViews as number | undefined) ?? 0 },
                    { label: 'Unique Visitors', value: (analytics.uniqueVisitors as number | undefined) ?? 0 },
                    {
                      label: 'Avg. Time on Page',
                      value:
                        typeof analytics.avgTimeOnPage === 'number'
                          ? `${analytics.avgTimeOnPage}s`
                          : '—',
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-1"
                    >
                      <p className="text-xs text-slate-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{String(stat.value)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => router.push(`/analytics/${portfolio.id}`)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
              >
                Open Full Analytics <BarChart3 className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Share ── */}
          {activeTab === 'share' && (
            <div className="space-y-5">
              {publicUrl ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400">Share your live portfolio with anyone.</p>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 overflow-hidden">
                    <span className="flex-1 text-sm text-slate-300 truncate min-w-0">{publicUrl}</span>
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        copied
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" /> Copied
                        </>
                      ) : (
                        'Copy'
                      )}
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
                </div>
              ) : (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                  <p className="text-sm text-amber-300 font-medium mb-1">Portfolio is not published yet</p>
                  <p className="text-xs text-amber-400/70 mb-4">
                    Publish your portfolio to get a shareable public link.
                  </p>
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
            <div className="space-y-4">
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
                  onClick={() => router.push(`/preview/${portfolio.id}`)}
                  className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10 transition-colors group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                    <Globe className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                      Publish & SEO Settings
                    </p>
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
                    <p className="text-sm font-medium text-rose-300">
                      {deleting ? 'Deleting...' : 'Delete Portfolio'}
                    </p>
                    <p className="text-xs text-rose-400/50">This action cannot be undone</p>
                  </div>
                </button>
              </div>

              {actionMsg && (
                <p
                  className={`text-sm ${
                    actionMsg.includes('success') ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {actionMsg}
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
