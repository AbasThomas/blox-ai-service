'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AssetType } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi } from '@/lib/api';
import { Mail, PlusCircle, ArrowUpRight, History, Sparkles } from 'lucide-react';

interface CoverLetterAsset {
  id: string;
  title: string;
  type: AssetType;
  updatedAt: string;
}

interface AssetVersion {
  id: string;
  versionLabel?: string;
  branchName?: string | null;
  createdAt: string;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString();
}

function getJobHint(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes('tailor') || normalized.includes('job')) {
    return 'Linked to a job-specific draft';
  }
  return 'General-purpose letter';
}

export default function CoverLettersPage() {
  const router = useRouter();
  const [letters, setLetters] = useState<CoverLetterAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobUrl, setJobUrl] = useState('');
  const [creatingFromJob, setCreatingFromJob] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
  const [versionLoadingId, setVersionLoadingId] = useState<string | null>(null);
  const [versionMap, setVersionMap] = useState<Record<string, AssetVersion[]>>({});

  const loadCoverLetters = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assetsApi.list(AssetType.COVER_LETTER);
      setLetters(Array.isArray(data) ? (data as CoverLetterAsset[]) : []);
    } catch {
      setLetters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoverLetters();
  }, [loadCoverLetters]);

  const recentLetters = useMemo(
    () => [...letters].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [letters],
  );

  const handleCreateFromJobUrl = useCallback(async () => {
    const trimmedUrl = jobUrl.trim();
    if (!trimmedUrl) {
      setMessage('Enter a job URL first.');
      return;
    }

    setCreatingFromJob(true);
    setMessage('');
    try {
      let source = 'Job';
      try {
        source = new URL(trimmedUrl).hostname.replace(/^www\./, '');
      } catch {
        source = 'Job Source';
      }

      const created = await assetsApi.create({
        type: AssetType.COVER_LETTER,
        title: `Cover Letter - ${source}`,
      }) as { id: string };

      router.push(`/cover-letters/${created.id}/edit?jobUrl=${encodeURIComponent(trimmedUrl)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create cover letter.');
    } finally {
      setCreatingFromJob(false);
    }
  }, [jobUrl, router]);

  const toggleVersions = useCallback(async (assetId: string) => {
    if (expandedVersionId === assetId) {
      setExpandedVersionId(null);
      return;
    }

    setExpandedVersionId(assetId);
    if (versionMap[assetId]) return;

    setVersionLoadingId(assetId);
    try {
      const versions = await assetsApi.listVersions(assetId) as AssetVersion[];
      setVersionMap((prev) => ({ ...prev, [assetId]: versions }));
    } catch {
      setVersionMap((prev) => ({ ...prev, [assetId]: [] }));
    } finally {
      setVersionLoadingId(null);
    }
  }, [expandedVersionId, versionMap]);

  return (
    <FeaturePage
      title="Cover Letters"
      description="Manage generated and edited cover letters, create from job URLs, and review version history."
      headerIcon={<Mail className="h-6 w-6" />}
    >
      <div className="space-y-6">
        <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 lg:grid-cols-[1fr_auto_auto]">
          <input
            value={jobUrl}
            onChange={(event) => setJobUrl(event.target.value)}
            placeholder="Paste job posting URL to generate a tailored letter"
            className="w-full rounded-lg border border-white/10 bg-[#0d151d] px-3 py-2 text-sm text-white outline-none focus:border-[#1ECEFA]/40"
          />
          <button
            type="button"
            onClick={handleCreateFromJobUrl}
            disabled={creatingFromJob}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1ECEFA]/40 bg-[#1ECEFA]/10 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-[#1ECEFA] transition-colors hover:bg-[#1ECEFA]/20 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {creatingFromJob ? 'Generating...' : 'Generate from Job URL'}
          </button>
          <Link
            href="/cover-letters/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1ECEFA] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-white"
          >
            <PlusCircle className="h-4 w-4" />
            New Cover Letter
          </Link>
        </div>

        {message ? (
          <div className="rounded-lg border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 px-3 py-2 text-xs text-[#1ECEFA]">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl border border-white/10 bg-black/20" />
            ))}
          </div>
        ) : recentLetters.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-12 text-center">
            <p className="text-sm text-slate-400">No cover letters yet. Create one to start applying faster.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentLetters.map((letter) => (
              <article
                key={letter.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 transition-colors hover:border-[#1ECEFA]/40"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-white">{letter.title}</h2>
                    <p className="mt-1 text-xs text-slate-500">Updated: {formatDate(letter.updatedAt)}</p>
                    <p className="mt-1 text-xs text-slate-500">Job link status: {getJobHint(letter.title)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:w-auto">
                    <Link
                      href={`/cover-letters/${letter.id}/edit`}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#1ECEFA]/50 hover:text-white"
                    >
                      Edit <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleVersions(letter.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#1ECEFA]/50 hover:text-white"
                    >
                      <History className="h-3.5 w-3.5" />
                      Version History
                    </button>
                  </div>
                </div>

                {expandedVersionId === letter.id ? (
                  <div className="mt-4 rounded-xl border border-white/10 bg-[#0d151d] p-3">
                    {versionLoadingId === letter.id ? (
                      <p className="text-xs text-slate-500">Loading version history...</p>
                    ) : (versionMap[letter.id] ?? []).length === 0 ? (
                      <p className="text-xs text-slate-500">No saved versions yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {(versionMap[letter.id] ?? []).slice(0, 6).map((version) => (
                          <li key={version.id} className="flex items-center justify-between text-xs">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-200">
                                {version.versionLabel ?? 'Untitled version'}
                              </p>
                              <p className="text-slate-500">{formatDate(version.createdAt)}</p>
                            </div>
                            <span className="ml-3 rounded-md border border-white/10 px-2 py-1 text-[10px] uppercase text-slate-400">
                              {version.branchName ?? 'main'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </FeaturePage>
  );
}
