'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AssetType } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi } from '@/lib/api';
import { ArrowUpRight, FileText, X } from '@/components/ui/icons';

interface ResumeDraftAsset {
  id: string;
  title: string;
  updatedAt: string;
  healthScore?: number | null;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString();
}

export default function ResumeDraftsPage() {
  const [drafts, setDrafts] = useState<ResumeDraftAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await assetsApi.list(AssetType.RESUME);
      setDrafts(Array.isArray(data) ? (data as ResumeDraftAsset[]) : []);
    } catch {
      setDrafts([]);
      setMessage('Could not load resume drafts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDrafts();
  }, [loadDrafts]);

  const draftCountLabel = useMemo(() => {
    if (loading) return 'Loading drafts...';
    return `${drafts.length} draft${drafts.length === 1 ? '' : 's'}`;
  }, [drafts.length, loading]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    setMessage('');
    try {
      await assetsApi.delete(id);
      setDrafts((previous) => previous.filter((draft) => draft.id !== id));
      setMessage('Draft deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete draft.');
    } finally {
      setDeletingId(null);
    }
  }, []);

  return (
    <FeaturePage
      title="Resume Drafts"
      description="See all saved resume drafts and remove the ones you no longer need."
      headerIcon={<FileText className="h-6 w-6" />}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{draftCountLabel}</p>
          <Link
            href="/resumes"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:border-[#1ECEFA]/40 hover:bg-[#1ECEFA]/10"
          >
            Back to Resumes
          </Link>
        </div>

        {message ? (
          <div className="rounded-lg border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 px-3 py-2 text-xs text-[#1ECEFA]">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-36 animate-pulse rounded-2xl border border-white/10 bg-black/20" />
            ))}
          </div>
        ) : drafts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-12 text-center">
            <p className="text-sm text-slate-400">No resume drafts found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {drafts.map((draft) => (
              <article
                key={draft.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 transition-colors hover:border-[#1ECEFA]/40"
              >
                <h2 className="truncate text-base font-bold text-white">{draft.title}</h2>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <p>
                    Health: <span className="font-bold text-white">{draft.healthScore ?? 0}%</span>
                  </p>
                  <p>
                    Updated: <span className="font-bold text-white">{formatDate(draft.updatedAt)}</span>
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/resumes/${draft.id}/edit`}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#1ECEFA]/50 hover:text-white"
                  >
                    Open <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(draft.id)}
                    disabled={deletingId === draft.id}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    {deletingId === draft.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </FeaturePage>
  );
}
