'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AssetType } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi } from '@/lib/api';
import { Mail, Plus, ArrowUpRight, History, Sparkles } from '@/components/ui/icons';

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
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getJobHint(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes('tailor') || normalized.includes('job')) return 'Job-specific draft';
  return 'General-purpose';
}

export default function CoverLettersPage() {
  const router = useRouter();
  const [letters, setLetters] = useState<CoverLetterAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobUrl, setJobUrl] = useState('');
  const [jobContextMap, setJobContextMap] = useState<Record<string, string>>({});
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

  useEffect(() => { loadCoverLetters(); }, [loadCoverLetters]);

  const recentLetters = useMemo(
    () => [...letters].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [letters],
  );

  useEffect(() => {
    let cancelled = false;
    const loadJobContext = async () => {
      const targets = recentLetters.slice(0, 10);
      const entries = await Promise.all(
        targets.map(async (letter) => {
          try {
            const fullAsset = await assetsApi.getById(letter.id) as { content?: { jobDescription?: string } };
            const rawJobDescription = fullAsset.content?.jobDescription?.trim();
            if (!rawJobDescription) return null;
            const cleaned = rawJobDescription.replace(/^Job URL:\s*/i, '').trim();
            if (cleaned.startsWith('http')) {
              try {
                const hostname = new URL(cleaned).hostname.replace(/^www\./, '');
                return [letter.id, hostname] as const;
              } catch {
                return [letter.id, cleaned.slice(0, 80)] as const;
              }
            }
            return [letter.id, cleaned.slice(0, 80)] as const;
          } catch { return null; }
        }),
      );
      if (cancelled) return;
      const mappedEntries = entries.filter((entry): entry is readonly [string, string] => entry !== null);
      if (mappedEntries.length === 0) return;
      setJobContextMap((prev) => ({ ...prev, ...Object.fromEntries(mappedEntries) }));
    };
    loadJobContext();
    return () => { cancelled = true; };
  }, [recentLetters]);

  const handleCreateFromJobUrl = useCallback(async () => {
    const trimmedUrl = jobUrl.trim();
    if (!trimmedUrl) { setMessage('Enter a job URL first.'); return; }
    setCreatingFromJob(true);
    setMessage('');
    try {
      let source = 'Job';
      try { source = new URL(trimmedUrl).hostname.replace(/^www\./, ''); } catch { source = 'Job Source'; }
      const created = await assetsApi.create({ type: AssetType.COVER_LETTER, title: `Cover Letter - ${source}` }) as { id: string };
      router.push(`/cover-letters/${created.id}/edit?jobUrl=${encodeURIComponent(trimmedUrl)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create cover letter.');
    } finally {
      setCreatingFromJob(false);
    }
  }, [jobUrl, router]);

  const toggleVersions = useCallback(async (assetId: string) => {
    if (expandedVersionId === assetId) { setExpandedVersionId(null); return; }
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
      description="Generate tailored cover letters from job URLs or write from scratch."
    >
      <div className="space-y-5">
        {/* Job URL generator */}
        <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] p-4">
          <p className="text-[12px] font-medium text-[#7A8DA0] mb-2">Generate from job posting</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="Paste job posting URL..."
              className="flex-1 h-9 rounded border border-[#1B2131] bg-[#0d1018] px-3 text-[13px] text-white placeholder-[#3A4452] outline-none focus:border-[#2A3A50] transition-colors"
            />
            <button
              type="button"
              onClick={handleCreateFromJobUrl}
              disabled={creatingFromJob}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded border border-[#1ECEFA]/30 text-[#1ECEFA] text-[12px] font-medium hover:bg-[#1ECEFA]/10 disabled:opacity-50 transition-colors"
            >
              <Sparkles size={13} />
              {creatingFromJob ? 'Generating...' : 'Generate'}
            </button>
            <Link
              href="/cover-letters/new"
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded bg-[#1ECEFA] text-[#060810] text-[12px] font-bold hover:bg-[#3DD5FF] transition-colors"
            >
              <Plus size={13} strokeWidth={3} /> New Letter
            </Link>
          </div>
        </div>

        {message && (
          <div className="rounded border border-[#1ECEFA]/20 bg-[#1ECEFA]/5 px-3 py-2 text-[12px] text-[#1ECEFA]">
            {message}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-md border border-[#1B2131] bg-[#0B0E14]" />
            ))}
          </div>
        ) : recentLetters.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[#1B2131] p-12 text-center gap-2">
            <Mail size={22} className="text-[#2E3847]" />
            <p className="text-[13px] text-[#4E5C6E]">No cover letters yet. Create one to start applying faster.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentLetters.map((letter) => (
              <article
                key={letter.id}
                className="rounded-md border border-[#1B2131] bg-[#0B0E14] px-4 py-4 hover:border-[#2A3A50] transition-colors"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-[14px] font-semibold text-white truncate">{letter.title}</h2>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-[#4E5C6E]">
                      <span>Updated {formatDate(letter.updatedAt)}</span>
                      <span>·</span>
                      <span>{jobContextMap[letter.id] ? `Linked: ${jobContextMap[letter.id]}` : getJobHint(letter.title)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/cover-letters/${letter.id}/edit`}
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-[#1B2131] text-[11px] text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] transition-colors"
                    >
                      Edit <ArrowUpRight size={11} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleVersions(letter.id)}
                      className={`inline-flex items-center gap-1 h-7 px-2.5 rounded border text-[11px] transition-colors ${
                        expandedVersionId === letter.id
                          ? 'border-[#1ECEFA]/30 bg-[#1ECEFA]/5 text-[#1ECEFA]'
                          : 'border-[#1B2131] text-[#7A8DA0] hover:text-white hover:border-[#2A3A50]'
                      }`}
                    >
                      <History size={11} /> History
                    </button>
                  </div>
                </div>

                {expandedVersionId === letter.id && (
                  <div className="mt-3 rounded border border-[#1B2131] bg-[#0d1018] p-3">
                    {versionLoadingId === letter.id ? (
                      <p className="text-[11px] text-[#4E5C6E]">Loading version history...</p>
                    ) : (versionMap[letter.id] ?? []).length === 0 ? (
                      <p className="text-[11px] text-[#4E5C6E]">No saved versions yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {(versionMap[letter.id] ?? []).slice(0, 6).map((version) => (
                          <li key={version.id} className="flex items-center justify-between text-[11px]">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#8899AA]">
                                {version.versionLabel ?? 'Untitled version'}
                              </p>
                              <p className="text-[#4E5C6E]">{formatDate(version.createdAt)}</p>
                            </div>
                            <span className="ml-3 font-mono text-[10px] text-[#3A4452] uppercase">
                              {version.branchName ?? 'main'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </FeaturePage>
  );
}
