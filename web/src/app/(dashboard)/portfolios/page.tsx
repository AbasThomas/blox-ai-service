'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AssetType } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi, onboardingApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import {
  BriefcaseBusiness,
  PlusCircle,
  ArrowUpRight,
  Globe,
  Sparkles,
  LayoutTemplate,
  Menu,
  X,
} from '@/components/ui/icons';

interface PortfolioAsset {
  id: string;
  title: string;
  type: AssetType;
  healthScore?: number | null;
  publishedUrl?: string | null;
  updatedAt: string;
}

interface LatestUnfinishedImport {
  runId: string;
  status: 'queued' | 'running' | 'awaiting_review' | 'partial' | 'failed' | 'completed';
  progressPct: number;
}

type ViewMode = 'grid' | 'list';

const DRAFT_PREFIX = 'blox_portfolio_new_draft';
const IGNORED_RUNS_PREFIX = 'blox_portfolio_ignored_runs';
const VIEW_MODE_KEY = 'blox_portfolio_view_mode';

function draftKey(uid: string) { return `${DRAFT_PREFIX}:${uid}`; }
function ignoredKey(uid: string) { return `${IGNORED_RUNS_PREFIX}:${uid}`; }

function readIgnored(uid: string): string[] {
  try {
    const raw = localStorage.getItem(ignoredKey(uid));
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? p.filter((v): v is string => typeof v === 'string') : [];
  } catch { return []; }
}

function writeIgnored(uid: string, ids: string[]) {
  localStorage.setItem(ignoredKey(uid), JSON.stringify(Array.from(new Set(ids))));
}

// Browser-mockup preview card for portfolios
function PortfolioCard({
  portfolio,
  onClick,
}: {
  portfolio: PortfolioAsset;
  onClick: () => void;
}) {
  const isLive = !!portfolio.publishedUrl;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.93, y: 24 },
        show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 30 } },
      }}
      layout
    >
      <button
        type="button"
        onClick={onClick}
        className="group relative w-full overflow-hidden rounded-2xl border border-white/5 bg-[#0C0F13] transition-all duration-300 hover:border-white/15 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
      >
        {/* Preview area */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#1ECEFA]/6 via-[#0C0F13] to-purple-500/8">
          {/* Browser chrome */}
          <div className="absolute inset-0 flex flex-col">
            <div className="h-7 border-b border-white/5 bg-white/[0.03] flex items-center gap-1.5 px-3 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/40" />
              <div className="ml-2 h-3 w-28 rounded-full bg-white/5" />
            </div>
            {/* Mock content lines */}
            <div className="flex-1 p-4 space-y-2 opacity-30 group-hover:opacity-50 transition-opacity duration-300">
              <div className="h-3 w-3/4 rounded-full bg-white/20" />
              <div className="h-2 w-1/2 rounded-full bg-white/10" />
              <div className="mt-3 h-2 w-full rounded-full bg-white/10" />
              <div className="h-2 w-5/6 rounded-full bg-white/10" />
              <div className="h-2 w-4/6 rounded-full bg-white/10" />
            </div>
          </div>

          {/* Status badge */}
          <div className="absolute top-10 right-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm ${
                isLive
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-600/20 bg-slate-600/10 text-slate-500'
              }`}
            >
              <span className={`h-1 w-1 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              {isLive ? 'Live' : 'Draft'}
            </span>
          </div>

          {/* Hover overlay cue */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30 backdrop-blur-[1px]">
            <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-medium text-white">
              View details
            </span>
          </div>
        </div>

        {/* Card footer */}
        <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between gap-2 text-left">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
              {portfolio.title}
            </h3>
          </div>
          <Globe className="h-3.5 w-3.5 shrink-0 text-slate-600 group-hover:text-[#1ECEFA] transition-colors" />
        </div>
      </button>
    </motion.div>
  );
}

// List row for list view
function PortfolioListRow({
  portfolio,
  onClick,
}: {
  portfolio: PortfolioAsset;
  onClick: () => void;
}) {
  const isLive = !!portfolio.publishedUrl;
  const date = new Date(portfolio.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3.5 text-left hover:bg-white/5 hover:border-white/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1ECEFA]/10 text-[#1ECEFA]">
        <BriefcaseBusiness className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
          {portfolio.title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">Updated {date}</p>
      </div>
      <span
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
          isLive
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
            : 'border-slate-600/20 bg-slate-600/10 text-slate-500'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
        {isLive ? 'Live' : 'Draft'}
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-white transition-colors shrink-0" />
    </button>
  );
}

export default function PortfoliosPage() {
  const router = useRouter();
  const userId = useBloxStore((state) => state.user.id);
  const [portfolios, setPortfolios] = useState<PortfolioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestUnfinishedRun, setLatestUnfinishedRun] = useState<LatestUnfinishedImport | null>(null);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [deletingDraft, setDeletingDraft] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [errorMsg, setErrorMsg] = useState('');

  const loadPortfolios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assetsApi.list(AssetType.PORTFOLIO);
      setPortfolios(Array.isArray(data) ? (data as PortfolioAsset[]) : []);
    } catch {
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPortfolios(); }, [loadPortfolios]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    if (saved === 'grid' || saved === 'list') setViewMode(saved);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const latest = (await onboardingApi.getLatestImport()) as LatestUnfinishedImport | null;
        if (!cancelled) {
          if (latest?.runId && userId) {
            const ignored = readIgnored(userId);
            setLatestUnfinishedRun(ignored.includes(latest.runId) ? null : latest);
          } else {
            setLatestUnfinishedRun(latest);
          }
        }
      } catch {
        if (!cancelled) setLatestUnfinishedRun(null);
      }
      if (typeof window !== 'undefined' && userId && !cancelled) {
        setHasLocalDraft(!!localStorage.getItem(draftKey(userId)));
      }
    };
    void init();
    return () => { cancelled = true; };
  }, [userId]);

  const handleDeleteDraft = useCallback(() => {
    if (!userId || deletingDraft) return;
    setDeletingDraft(true);
    try {
      localStorage.removeItem(draftKey(userId));
      setHasLocalDraft(false);
      if (latestUnfinishedRun?.runId) {
        writeIgnored(userId, [...readIgnored(userId), latestUnfinishedRun.runId]);
      }
      setLatestUnfinishedRun(null);
    } finally {
      setDeletingDraft(false);
    }
  }, [deletingDraft, latestUnfinishedRun?.runId, userId]);

  return (
    <FeaturePage
      title="Portfolios"
      description="Create, manage, and publish your professional portfolios."
      headerIcon={<BriefcaseBusiness className="h-6 w-6" />}
    >
      <div className="space-y-8">
        {/* Draft banner */}
        {(latestUnfinishedRun || hasLocalDraft) && (
          <div className="rounded-2xl border border-[#1ECEFA]/20 bg-[#1ECEFA]/5 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#1ECEFA]">Unfinished Portfolio Draft</p>
              <p className="mt-1 text-xs text-slate-400">
                {latestUnfinishedRun
                  ? `Import in progress: ${latestUnfinishedRun.status} (${latestUnfinishedRun.progressPct}%)`
                  : 'A local draft is waiting for you.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/portfolios/new"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#1ECEFA] transition-colors"
              >
                Open Draft <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={handleDeleteDraft}
                disabled={deletingDraft}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-60 transition-colors"
              >
                {deletingDraft ? 'Deleting...' : 'Delete Draft'}
              </button>
            </div>
          </div>
        )}

        {/* Header row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 justify-center sm:justify-start">
              All Portfolios <Sparkles className="h-4 w-4 text-[#1ECEFA]" />
            </h2>
            <p className="text-xs text-slate-500">
              {portfolios.length} {portfolios.length === 1 ? 'portfolio' : 'portfolios'} in the cloud
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end">
            {/* View toggle */}
            <div className="inline-flex items-center rounded-xl border border-white/10 bg-black/30 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  viewMode === 'grid' ? 'bg-[#1ECEFA] text-black' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <LayoutTemplate className="h-3.5 w-3.5" />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  viewMode === 'list' ? 'bg-[#1ECEFA] text-black' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Menu className="h-3.5 w-3.5" />
                List
              </button>
            </div>

            <Link
              href="/portfolios/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#1ECEFA] px-5 py-2.5 text-xs font-semibold text-[#0C0F13] hover:bg-white hover:scale-[1.02] transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              Create Portfolio
            </Link>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg('')}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-video animate-pulse rounded-2xl border border-white/5 bg-black/20" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl border border-white/5 bg-black/20" />
              ))}
            </div>
          )
        ) : portfolios.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#1ECEFA]/20 bg-[#1ECEFA]/10 text-[#1ECEFA]">
              <BriefcaseBusiness className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-white">No portfolios yet</h3>
            <p className="mt-2 text-sm text-slate-400 max-w-sm">
              Create your first portfolio to showcase your work professionally.
            </p>
            <Link
              href="/portfolios/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0C0F13] hover:bg-[#1ECEFA] hover:scale-[1.03] transition-all"
            >
              Start Building <ArrowUpRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : viewMode === 'grid' ? (
          /* Grid view */
          <motion.div
            variants={{ show: { transition: { staggerChildren: 0.07 } }, hidden: {} }}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {portfolios.map((portfolio) => (
              <PortfolioCard
                key={portfolio.id}
                portfolio={portfolio}
                onClick={() => router.push(`/portfolios/${portfolio.id}`)}
              />
            ))}
          </motion.div>
        ) : (
          /* List view */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {portfolios.map((portfolio) => (
              <PortfolioListRow
                key={portfolio.id}
                portfolio={portfolio}
                onClick={() => router.push(`/portfolios/${portfolio.id}`)}
              />
            ))}
          </motion.div>
        )}
      </div>

    </FeaturePage>
  );
}
