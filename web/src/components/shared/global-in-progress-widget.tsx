'use client';

import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { assetsApi, onboardingApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import { BriefcaseBusiness, FileText, Mail, MousePointer2, Zap } from '@/components/ui/icons';

type AssetType = 'PORTFOLIO' | 'RESUME' | 'COVER_LETTER';
type GeneratingStatus = 'queued' | 'processing';
type ImportStatus = 'queued' | 'running' | 'awaiting_review' | 'partial' | 'failed' | 'completed';

interface InProgressAsset {
  id: string;
  type: AssetType;
  title: string;
  updatedAt: string;
  generatingStatus: GeneratingStatus;
}

interface LatestUnfinishedImport {
  runId: string;
  status: ImportStatus;
  progressPct: number;
  updatedAt?: string;
}

interface WidgetTask {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  updatedAtMs: number;
  kind: 'import' | 'asset';
  assetType?: AssetType;
}

interface WidgetPosition {
  x: number;
  y: number;
}

const WIDGET_STORAGE_KEY = 'blox_in_progress_widget_position_v1';
const PORTFOLIO_IGNORED_RUNS_STORAGE_PREFIX = 'blox_portfolio_ignored_runs';
const POLL_MS = 10_000;
const WIDGET_WIDTH = 220;
const WIDGET_HEIGHT = 128;
const VIEWPORT_GAP = 12;
const IN_PROGRESS_IMPORT_STATUSES = new Set<ImportStatus>(['queued', 'running', 'awaiting_review', 'partial']);

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

function toTimestamp(value?: string) {
  if (!value) return Date.now();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function toAssetRoute(type: AssetType, id: string) {
  if (type === 'PORTFOLIO') return `/portfolios/${id}/edit`;
  if (type === 'RESUME') return `/resumes/${id}/edit`;
  return `/cover-letters/${id}/edit`;
}

function clampPosition(position: WidgetPosition): WidgetPosition {
  if (typeof window === 'undefined') return position;

  const maxX = Math.max(VIEWPORT_GAP, window.innerWidth - WIDGET_WIDTH - VIEWPORT_GAP);
  const maxY = Math.max(VIEWPORT_GAP, window.innerHeight - WIDGET_HEIGHT - VIEWPORT_GAP);

  return {
    x: Math.min(Math.max(position.x, VIEWPORT_GAP), maxX),
    y: Math.min(Math.max(position.y, VIEWPORT_GAP), maxY),
  };
}

function taskIcon(task: WidgetTask) {
  if (task.kind === 'import') {
    return <Zap className="h-3.5 w-3.5 text-[#1ECEFA]" />;
  }
  if (task.assetType === 'PORTFOLIO') {
    return <BriefcaseBusiness className="h-3.5 w-3.5 text-[#1ECEFA]" />;
  }
  if (task.assetType === 'RESUME') {
    return <FileText className="h-3.5 w-3.5 text-[#1ECEFA]" />;
  }
  return <Mail className="h-3.5 w-3.5 text-[#1ECEFA]" />;
}

function importSubtitle(status: ImportStatus, progressPct: number) {
  if (status === 'awaiting_review') return 'Review AI merge before finalizing';
  if (status === 'partial') return 'Resolve partial import details';
  if (status === 'running') return `Generating draft (${progressPct}%)`;
  return `Queued (${progressPct}%)`;
}

export function GlobalInProgressWidget() {
  const isAuthenticated = useBloxStore((state) => state.isAuthenticated);
  const accessToken = useBloxStore((state) => state.accessToken);
  const userId = useBloxStore((state) => state.user.id);

  const [position, setPosition] = useState<WidgetPosition | null>(null);
  const [tasks, setTasks] = useState<WidgetTask[]>([]);

  const hasSession = isAuthenticated && Boolean(accessToken);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fallback = clampPosition({
      x: window.innerWidth - WIDGET_WIDTH - VIEWPORT_GAP,
      y: window.innerHeight - WIDGET_HEIGHT - 92,
    });

    try {
      const raw = localStorage.getItem(WIDGET_STORAGE_KEY);
      if (!raw) {
        setPosition(fallback);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<WidgetPosition>;
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        setPosition(clampPosition({ x: parsed.x, y: parsed.y }));
        return;
      }
    } catch {
      // ignore invalid widget position
    }

    setPosition(fallback);
  }, []);

  useEffect(() => {
    if (!position || typeof window === 'undefined') return;
    localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    if (!position || typeof window === 'undefined') return;

    const handleResize = () => {
      setPosition((previous) => (previous ? clampPosition(previous) : previous));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  const loadTasks = useCallback(async () => {
    if (!hasSession) {
      setTasks([]);
      return;
    }

    try {
      const [assetRows, latestImport] = await Promise.all([
        assetsApi.listInProgress(),
        onboardingApi.getLatestImport(),
      ]);

      const nextTasks: WidgetTask[] = [];
      const importRun = latestImport as LatestUnfinishedImport | null;
      const ignoredRunIds = userId ? readIgnoredRunIds(userId) : [];
      if (
        importRun &&
        IN_PROGRESS_IMPORT_STATUSES.has(importRun.status) &&
        !ignoredRunIds.includes(importRun.runId)
      ) {
        nextTasks.push({
          id: `import:${importRun.runId}`,
          href: '/portfolios/new',
          title: 'Portfolio Draft In Progress',
          subtitle: importSubtitle(importRun.status, importRun.progressPct),
          updatedAtMs: toTimestamp(importRun.updatedAt),
          kind: 'import',
        });
      }

      const inProgressAssets = Array.isArray(assetRows) ? (assetRows as InProgressAsset[]) : [];
      for (const asset of inProgressAssets) {
        if (asset.generatingStatus !== 'queued' && asset.generatingStatus !== 'processing') continue;

        nextTasks.push({
          id: `asset:${asset.id}`,
          href: toAssetRoute(asset.type, asset.id),
          title: asset.title || `${asset.type} Draft`,
          subtitle: asset.generatingStatus === 'processing' ? 'AI generation running' : 'Queued for AI generation',
          updatedAtMs: toTimestamp(asset.updatedAt),
          kind: 'asset',
          assetType: asset.type,
        });
      }

      nextTasks.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      setTasks(nextTasks);
    } catch {
      // keep current tasks on transient failures
    }
  }, [hasSession, userId]);

  useEffect(() => {
    void loadTasks();

    if (!hasSession) return;
    const timer = window.setInterval(() => {
      void loadTasks();
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [hasSession, loadTasks]);

  const openTask = useCallback((href: string) => {
    if (typeof window === 'undefined') return;
    window.location.assign(href);
  }, []);

  const dragHandlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!position) return;

      const offsetX = event.clientX - position.x;
      const offsetY = event.clientY - position.y;

      const onMove = (moveEvent: PointerEvent) => {
        setPosition(
          clampPosition({
            x: moveEvent.clientX - offsetX,
            y: moveEvent.clientY - offsetY,
          }),
        );
      };

      const onEnd = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onEnd);
    },
    [position],
  );

  const visibleTasks = useMemo(() => tasks.slice(0, 2), [tasks]);

  if (!hasSession || !position || tasks.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed z-[70] select-none"
      style={{ left: position.x, top: position.y }}
    >
      <div className="w-[220px] rounded-xl border border-[#1ECEFA]/35 bg-[#050c14]/95 p-2 shadow-[0_16px_42px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onPointerDown={dragHandlePointerDown}
            className="inline-flex cursor-grab items-center gap-1 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 active:cursor-grabbing"
            aria-label="Drag in-progress widget"
          >
            <MousePointer2 className="h-3.5 w-3.5 text-slate-400" />
            Drag
          </button>
          <span className="rounded-md border border-[#1ECEFA]/25 bg-[#1ECEFA]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1ECEFA]">
            {tasks.length}
          </span>
        </div>

        <div className="space-y-1.5">
          {visibleTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => openTask(task.href)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-left transition-colors hover:border-[#1ECEFA]/45 hover:bg-[#0b1520]"
            >
              <div className="flex items-center gap-1.5">
                {taskIcon(task)}
                <p className="truncate text-[10px] font-bold uppercase tracking-wider text-white">
                  {task.title}
                </p>
              </div>
              <p className="mt-1 truncate text-[10px] text-slate-400">{task.subtitle}</p>
            </button>
          ))}
        </div>

        {tasks.length > visibleTasks.length ? (
          <p className="mt-1.5 text-center text-[10px] text-slate-500">
            +{tasks.length - visibleTasks.length} more in progress
          </p>
        ) : null}
      </div>
    </div>
  );
}
