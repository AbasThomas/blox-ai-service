'use client';

import Link from 'next/link';
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
  BarChart3,
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
  updatedAt?: string;
}

type PortfolioViewMode = 'grid' | 'list';

const PORTFOLIO_DRAFT_STORAGE_PREFIX = 'blox_portfolio_new_draft';
const PORTFOLIO_IGNORED_RUNS_STORAGE_PREFIX = 'blox_portfolio_ignored_runs';
const PORTFOLIO_VIEW_MODE_STORAGE_KEY = 'blox_portfolio_view_mode';

function portfolioDraftKey(userId: string) {
  return `${PORTFOLIO_DRAFT_STORAGE_PREFIX}:${userId}`;
}

function portfolioIgnoredRunsKey(userId: string) {
  return `${PORTFOLIO_IGNORED_RUNS_STORAGE_PREFIX}:${userId}`;
}

function readIgnoredRunIds(userId: string): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(portfolioIgnoredRunsKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
}

function writeIgnoredRunIds(userId: string, runIds: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(portfolioIgnoredRunsKey(userId), JSON.stringify(Array.from(new Set(runIds))));
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString();
}

export default function PortfoliosPage() {
  const userId = useBloxStore((state) => state.user.id);
  const [portfolios, setPortfolios] = useState<PortfolioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestUnfinishedRun, setLatestUnfinishedRun] = useState<LatestUnfinishedImport | null>(null);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [deletingDraft, setDeletingDraft] = useState(false);
  const [viewMode, setViewMode] = useState<PortfolioViewMode>('grid');
  const [deletingPortfolioId, setDeletingPortfolioId] = useState<string | null>(null);
  const [portfolioActionError, setPortfolioActionError] = useState('');

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

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(PORTFOLIO_VIEW_MODE_STORAGE_KEY);
    if (saved === 'grid' || saved === 'list') {
      setViewMode(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PORTFOLIO_VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    let cancelled = false;

    const loadDraftState = async () => {
      try {
        const latest = (await onboardingApi.getLatestImport()) as LatestUnfinishedImport | null;
        if (!cancelled) {
          if (latest?.runId && userId) {
            const ignoredRunIds = readIgnoredRunIds(userId);
            setLatestUnfinishedRun(ignoredRunIds.includes(latest.runId) ? null : latest);
          } else {
            setLatestUnfinishedRun(latest);
          }
        }
      } catch {
        if (!cancelled) setLatestUnfinishedRun(null);
      }

      if (typeof window !== 'undefined' && userId && !cancelled) {
        setHasLocalDraft(!!localStorage.getItem(portfolioDraftKey(userId)));
      }
    };

    void loadDraftState();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleDeleteDraft = useCallback(() => {
    if (!userId || deletingDraft) return;

    setDeletingDraft(true);
    try {
      localStorage.removeItem(portfolioDraftKey(userId));
      setHasLocalDraft(false);

      if (latestUnfinishedRun?.runId) {
        const ignoredRunIds = readIgnoredRunIds(userId);
        writeIgnoredRunIds(userId, [...ignoredRunIds, latestUnfinishedRun.runId]);
      }

      setLatestUnfinishedRun(null);
    } finally {
      setDeletingDraft(false);
    }
  }, [deletingDraft, latestUnfinishedRun?.runId, userId]);

  const handleDeletePortfolio = useCallback(
    async (portfolioId: string, portfolioTitle: string) => {
      if (deletingPortfolioId) return;
      if (
        !window.confirm(
          `Delete "${portfolioTitle}"? This action cannot be undone.`,
        )
      ) {
        return;
      }

      setPortfolioActionError('');
      setDeletingPortfolioId(portfolioId);
      try {
        await assetsApi.delete(portfolioId);
        setPortfolios((previous) =>
          previous.filter((portfolio) => portfolio.id !== portfolioId),
        );
      } catch (error) {
        setPortfolioActionError(
          error instanceof Error
            ? error.message
            : 'Could not delete portfolio.',
        );
      } finally {
        setDeletingPortfolioId(null);
      }
    },
    [deletingPortfolioId],
  );

  return (
    <FeaturePage
      title="Portfolios"
      description="Manage your professional showcases. Create, edit, and monitor your global presence."
      headerIcon={<BriefcaseBusiness className="h-6 w-6" />}
    >
      <div className="space-y-8">
        {(latestUnfinishedRun || hasLocalDraft) && (
          <div className="rounded-2xl border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#1ECEFA]">Unfinished Portfolio Draft</p>
              <p className="mt-1 text-sm text-slate-200">
                {latestUnfinishedRun
                  ? `Last run status: ${latestUnfinishedRun.status.toUpperCase()} (${latestUnfinishedRun.progressPct}%).`
                  : 'Recovered local progress is available.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/portfolios/new"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black transition-all hover:bg-[#1ECEFA]"
              >
                Open Draft <ArrowUpRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={handleDeleteDraft}
                disabled={deletingDraft}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-xs font-semibold text-red-300 transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingDraft ? 'Deleting...' : 'Delete Draft'}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6 pb-6 border-b border-white/5">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-base md:text-lg font-black text-white  flex items-center gap-2 justify-center sm:justify-start">
             All Portfolios <Sparkles className="h-4 w-4 text-[#1ECEFA]" />
            </h2>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{portfolios.length} portfolio stored in the cloud.</p>
          </div>
          <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end">
            <div className="inline-flex items-center rounded-xl border border-white/10 bg-black/30 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  viewMode === 'grid'
                    ? 'bg-[#1ECEFA] text-black'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <LayoutTemplate className="h-3.5 w-3.5" />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  viewMode === 'list'
                    ? 'bg-[#1ECEFA] text-black'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Menu className="h-3.5 w-3.5" />
                List
              </button>
            </div>
            <Link
              href="/portfolios/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl md:rounded-2xl bg-[#1ECEFA] px-5 py-3 md:px-6 md:py-4 text-xs font-semibold text-[#0C0F13] transition-all hover:bg-white hover:scale-[1.02] shadow-sm hover:shadow-md"
            >
              <PlusCircle className="h-4 w-4" />
              Create New Portfolio
            </Link>
          </div>
        </div>

        {portfolioActionError ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            <span>{portfolioActionError}</span>
            <button
              type="button"
              onClick={() => setPortfolioActionError('')}
              className="inline-flex items-center rounded-md border border-rose-300/30 px-2 py-1 text-[11px] font-semibold text-rose-200 hover:bg-rose-500/20"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        {loading ? (
          viewMode === 'grid' ? (
            <div className="grid gap-4 md:gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-black/20"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-2xl border border-white/5 bg-black/20"
                />
              ))}
            </div>
          )
        ) : portfolios.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex flex-col items-center justify-center overflow-hidden relative rounded-2xl md:rounded-[3rem] border border-white/5 bg-[#161B22]/40 p-10 md:p-20 text-center"
          >
            <div className="absolute inset-0 b" />
            
            <motion.div 
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
              className="mb-8 flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-2xl md:rounded-[2rem] border border-[#1ECEFA]/20 bg-[#1ECEFA]/10 text-[#1ECEFA] shadow-sm z-10"
            >
              <BriefcaseBusiness className="h-10 w-10 md:h-12 md:w-12" strokeWidth={1.5} />
            </motion.div>
            
            <h3 className="text-xl md:text-2xl font-black text-white  z-10">No Portfolios Detected</h3>
            <p className="mt-4 text-sm font-medium text-slate-400 max-w-sm leading-relaxed z-10">Your professional node is currently empty. Initialize your first digital instance to deploy your identity.</p>
            
            <Link 
              href="/portfolios/new" 
              className="group mt-6 relative inline-flex items-center justify-center gap-2 rounded-xl md:rounded-2xl bg-white px-6 py-3 md:px-8 md:py-4 text-sm font-black text-[#0C0F13] transition-all hover:bg-[#1ECEFA] hover:scale-[1.05] z-10 shadow-sm hover:shadow-md"
            >
              START BUILDING
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div
            variants={{
              show: { transition: { staggerChildren: 0.1 } },
              hidden: {},
            }}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:gap-6 sm:grid-cols-2 xl:grid-cols-3"
          >
            {portfolios.map((portfolio) => (
              <motion.article
                variants={{
                  hidden: { opacity: 0, scale: 0.9, y: 30 },
                  show: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: { type: 'spring', stiffness: 400, damping: 30 },
                  },
                }}
                key={portfolio.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-[#161B22]/30 backdrop-blur-md transition-all duration-500 hover:border-[#1ECEFA]/40 hover:bg-[#161B22]/60 hover:-translate-y-2 hover:shadow-[0_20px_40px_-20px_rgba(30,206,250,0.15)]"
              >
                <div className="absolute -inset-1 bg-gradient-to-br from-[#1ECEFA]/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 blur-xl" />

                <div className="relative z-10 flex h-full flex-col p-6 md:p-8">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <h2 className="line-clamp-1 text-lg md:text-xl font-black text-white tracking-tighter uppercase group-hover:text-[#1ECEFA] transition-colors duration-300">
                        {portfolio.title}
                      </h2>
                      <p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                        Epoch: {formatDate(portfolio.updatedAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0">
                      <span className="pointer-events-none relative flex items-center gap-1.5 overflow-hidden rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-inner transition-colors group-hover:border-[#1ECEFA]/30">
                        <span className="relative z-10 text-[#1ECEFA]">
                          {portfolio.healthScore ?? 0}% HEALTH
                        </span>
                        <div
                          className="absolute bottom-0 left-0 top-0 bg-[#1ECEFA]/20 transition-all duration-700"
                          style={{ width: `${portfolio.healthScore ?? 0}%` }}
                        />
                      </span>
                    </div>
                  </div>

                  <div className="mb-2 flex-1 space-y-4">
                    <div className="flex w-max items-center gap-2.5 rounded-xl border border-white/5 bg-black/30 px-3 py-1.5 md:rounded-2xl md:px-4 md:py-2">
                      <div className="relative flex h-2.5 w-2.5">
                        {portfolio.publishedUrl ? (
                          <>
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1ECEFA] opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#1ECEFA]" />
                          </>
                        ) : (
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-slate-600" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${portfolio.publishedUrl ? 'text-white' : 'text-slate-500'}`}
                      >
                        {portfolio.publishedUrl ? 'ACTIVE PROTOCOL' : 'DRAFT STATE'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <Link
                      href={`/portfolios/${portfolio.id}/edit`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg md:rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#1ECEFA] transition-all hover:bg-[#1ECEFA] hover:text-[#0C0F13] hover:border-[#1ECEFA]"
                    >
                      EDIT <ArrowUpRight className="h-3 w-3" />
                    </Link>
                    <Link
                      href={`/preview/${portfolio.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg md:rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all hover:bg-white hover:text-[#0C0F13] hover:border-white"
                    >
                      {portfolio.publishedUrl ? 'PREVIEW' : 'PUBLISH'}
                    </Link>
                    <Link
                      href={`/analytics/${portfolio.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg md:rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all hover:bg-white hover:text-[#0C0F13] hover:border-white"
                    >
                      <BarChart3 className="h-3.5 w-3.5" /> ANALYTICS
                    </Link>
                    {portfolio.publishedUrl ? (
                      <a
                        href={
                          portfolio.publishedUrl.startsWith('http')
                            ? portfolio.publishedUrl
                            : `https://${portfolio.publishedUrl}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg md:rounded-xl border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#1ECEFA] transition-all hover:bg-[#1ECEFA] hover:text-[#0C0F13]"
                      >
                        <Globe className="h-3.5 w-3.5" /> LIVE
                      </a>
                    ) : (
                      <div className="cursor-not-allowed inline-flex items-center justify-center rounded-lg md:rounded-xl border border-transparent bg-black/20 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600">
                        OFFLINE
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        void handleDeletePortfolio(portfolio.id, portfolio.title)
                      }
                      disabled={deletingPortfolioId === portfolio.id}
                      className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg md:rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[10px] font-semibold text-rose-200 transition-all hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingPortfolioId === portfolio.id
                        ? 'Deleting...'
                        : 'Delete Portfolio'}
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {portfolios.map((portfolio) => (
              <article
                key={portfolio.id}
                className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#161B22]/40 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 space-y-1">
                    <h3 className="line-clamp-1 text-base font-semibold text-white">
                      {portfolio.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Updated {formatDate(portfolio.updatedAt)} • Health{' '}
                      {portfolio.healthScore ?? 0}%
                    </p>
                    <p className="text-xs text-slate-500">
                      {portfolio.publishedUrl ? 'Published' : 'Draft'}
                    </p>
                  </div>

                  <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-5">
                    <Link
                      href={`/portfolios/${portfolio.id}/edit`}
                      className="inline-flex items-center justify-center rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/preview/${portfolio.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                    >
                      {portfolio.publishedUrl ? 'Preview' : 'Publish'}
                    </Link>
                    <Link
                      href={`/analytics/${portfolio.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                    >
                      Analytics
                    </Link>
                    {portfolio.publishedUrl ? (
                      <a
                        href={
                          portfolio.publishedUrl.startsWith('http')
                            ? portfolio.publishedUrl
                            : `https://${portfolio.publishedUrl}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-lg border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 px-3 py-2 text-xs font-semibold text-[#1ECEFA] hover:bg-[#1ECEFA]/20"
                      >
                        Live
                      </a>
                    ) : (
                      <div className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs font-semibold text-slate-500">
                        Offline
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        void handleDeletePortfolio(portfolio.id, portfolio.title)
                      }
                      disabled={deletingPortfolioId === portfolio.id}
                      className="inline-flex items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingPortfolioId === portfolio.id
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </motion.div>
        )}
      </div>
    </FeaturePage>
  );
}
