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
  Plus,
  ArrowUpRight,
  Globe,
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

function PortfolioCard({ portfolio, onClick }: { portfolio: PortfolioAsset; onClick: () => void }) {
  const isLive = !!portfolio.publishedUrl;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 30 } },
      }}
      layout
    >
      <button
        type="button"
        onClick={onClick}
        className="group relative w-full overflow-hidden rounded-md border border-[#1B2131] bg-[#0B0E14] hover:border-[#2A3A50] transition-colors focus:outline-none"
      >
        <div className="relative aspect-video overflow-hidden bg-[#080A0E]">
          {/* Browser chrome */}
          <div className="absolute inset-0 flex flex-col">
            <div className="h-7 border-b border-[#1B2131] bg-[#080A0E] flex items-center gap-1.5 px-3 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/40" />
              <div className="ml-2 h-3 w-28 rounded-sm bg-[#1B2131]" />
            </div>
            <div className="flex-1 p-4 space-y-2 opacity-20 group-hover:opacity-35 transition-opacity">
              <div className="h-3 w-3/4 rounded-sm bg-[#4E5C6E]" />
              <div className="h-2 w-1/2 rounded-sm bg-[#2E3847]" />
              <div className="mt-3 h-2 w-full rounded-sm bg-[#2E3847]" />
              <div className="h-2 w-5/6 rounded-sm bg-[#2E3847]" />
              <div className="h-2 w-4/6 rounded-sm bg-[#2E3847]" />
            </div>
          </div>

          {/* Status badge */}
          <div className="absolute top-9 right-3">
            <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${
              isLive ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-[#1B2131] bg-[#080A0E] text-[#4E5C6E]'
            }`}>
              <span className={`h-1 w-1 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-[#2E3847]'}`} />
              {isLive ? 'Live' : 'Draft'}
            </span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            <span className="rounded border border-[#2A3A50] bg-[#0B0E14] px-3 py-1.5 text-[11px] font-medium text-white">
              Open
            </span>
          </div>
        </div>

        <div className="px-3 py-2.5 border-t border-[#1B2131] flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-medium text-[#8899AA] truncate group-hover:text-white transition-colors">
            {portfolio.title}
          </h3>
          <Globe size={13} className="shrink-0 text-[#2E3847] group-hover:text-[#1ECEFA] transition-colors" />
        </div>
      </button>
    </motion.div>
  );
}

function PortfolioListRow({ portfolio, onClick }: { portfolio: PortfolioAsset; onClick: () => void }) {
  const isLive = !!portfolio.publishedUrl;
  const date = new Date(portfolio.updatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full flex items-center gap-4 border-b border-[#1B2131] px-4 py-3 last:border-b-0 text-left hover:bg-[#0d1018] transition-colors focus:outline-none"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[#1B2131] bg-[#0d1018] text-[#4E5C6E] group-hover:text-[#1ECEFA] transition-colors">
        <BriefcaseBusiness size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[#8899AA] truncate group-hover:text-white transition-colors">
          {portfolio.title}
        </p>
        <p className="text-[11px] text-[#3A4452]">Updated {date}</p>
      </div>
      <span className={`shrink-0 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] ${
        isLive ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-[#1B2131] text-[#4E5C6E]'
      }`}>
        <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-[#2E3847]'}`} />
        {isLive ? 'Live' : 'Draft'}
      </span>
      <ArrowUpRight size={13} className="text-[#2E3847] group-hover:text-[#4E5C6E] transition-colors shrink-0" />
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
    >
      <div className="space-y-6">
        {/* Draft banner */}
        {(latestUnfinishedRun || hasLocalDraft) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border border-[#1ECEFA]/20 bg-[#1ECEFA]/5 px-4 py-3">
            <div>
              <p className="text-[13px] font-semibold text-[#1ECEFA]">Unfinished portfolio draft</p>
              <p className="mt-0.5 text-[12px] text-[#4E5C6E]">
                {latestUnfinishedRun
                  ? `Import in progress: ${latestUnfinishedRun.status} (${latestUnfinishedRun.progressPct}%)`
                  : 'A local draft is waiting for you.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/portfolios/new"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded border border-[#1ECEFA]/30 text-[#1ECEFA] text-[12px] font-medium hover:bg-[#1ECEFA]/10 transition-colors"
              >
                Open Draft <ArrowUpRight size={12} />
              </Link>
              <button
                type="button"
                onClick={handleDeleteDraft}
                disabled={deletingDraft}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded border border-rose-500/20 text-rose-400 text-[12px] font-medium hover:bg-rose-500/10 disabled:opacity-60 transition-colors"
              >
                {deletingDraft ? 'Deleting...' : 'Discard'}
              </button>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-[13px] text-[#4E5C6E]">
              {portfolios.length} {portfolios.length === 1 ? 'portfolio' : 'portfolios'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center h-8 rounded border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center h-8 w-8 transition-colors ${
                  viewMode === 'grid' ? 'bg-[#141C28] text-white' : 'text-[#46566A] hover:text-[#8899AA]'
                }`}
              >
                <LayoutTemplate size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center h-8 w-8 transition-colors border-l border-[#1B2131] ${
                  viewMode === 'list' ? 'bg-[#141C28] text-white' : 'text-[#46566A] hover:text-[#8899AA]'
                }`}
              >
                <Menu size={14} />
              </button>
            </div>

            <Link
              href="/portfolios/new"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-[#1ECEFA] text-[#060810] text-[12px] font-bold hover:bg-[#3DD5FF] transition-colors"
            >
              <Plus size={13} strokeWidth={3} /> New Portfolio
            </Link>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="flex items-center justify-between gap-3 rounded border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg('')}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          viewMode === 'grid' ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-video animate-pulse rounded-md border border-[#1B2131] bg-[#0B0E14]" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse border-b border-[#1B2131] last:border-b-0 bg-[#0d1018]" />
              ))}
            </div>
          )
        ) : portfolios.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-md border border-dashed border-[#1B2131] p-16 text-center"
          >
            <BriefcaseBusiness size={28} className="text-[#2E3847]" strokeWidth={1.5} />
            <h3 className="mt-4 text-[14px] font-semibold text-white">No portfolios yet</h3>
            <p className="mt-1.5 text-[12px] text-[#4E5C6E] max-w-xs">
              Create your first portfolio to showcase your work professionally.
            </p>
            <Link
              href="/portfolios/new"
              className="mt-5 inline-flex items-center gap-1.5 h-9 px-5 rounded bg-[#1ECEFA] text-[#060810] text-[12px] font-bold hover:bg-[#3DD5FF] transition-colors"
            >
              <Plus size={13} strokeWidth={3} /> Start Building
            </Link>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div
            variants={{ show: { transition: { staggerChildren: 0.06 } }, hidden: {} }}
            initial="hidden"
            animate="show"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-md border border-[#1B2131] bg-[#0B0E14] overflow-hidden"
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
