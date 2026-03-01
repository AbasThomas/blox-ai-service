'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { templatesApi } from '@/lib/api';
import { LayoutTemplate, Search, GitFork, ScanSearch, ArrowUpRight } from 'lucide-react';

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  industry: string;
  createdAt: string;
}

type CategoryFilter = 'ALL' | 'PORTFOLIO' | 'RESUME' | 'COVER_LETTER';

function categoryMatches(category: string, filter: CategoryFilter) {
  if (filter === 'ALL') return true;
  const normalized = category.toUpperCase();
  return normalized.includes(filter);
}

function normalizeCategoryLabel(category: string) {
  return category.replaceAll('_', ' ').toUpperCase();
}

function editPathForForkedAsset(category: string, assetId: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes('resume')) return `/resumes/${assetId}/edit`;
  if (normalized.includes('cover')) return `/cover-letters/${assetId}/edit`;
  return `/portfolios/${assetId}/edit`;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CategoryFilter>('ALL');
  const [forkingId, setForkingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await templatesApi.list({
        search: search.trim(),
      });
      const rows = Array.isArray(data) ? (data as TemplateItem[]) : [];
      setTemplates(rows);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadTemplates, 300);
    return () => clearTimeout(timer);
  }, [loadTemplates]);

  const visibleTemplates = useMemo(
    () => templates.filter((template) => categoryMatches(template.category, filter)),
    [templates, filter],
  );

  const handleFork = useCallback(async (template: TemplateItem) => {
    setForkingId(template.id);
    setMessage('');
    try {
      const result = await templatesApi.fork(template.id) as { assetId: string };
      router.push(editPathForForkedAsset(template.category, result.assetId));
    } catch (forkError) {
      setMessage(forkError instanceof Error ? forkError.message : 'Could not fork template.');
    } finally {
      setForkingId(null);
    }
  }, [router]);

  return (
    <FeaturePage
      title="Templates & Tools"
      description="Browse templates, search and fork quickly, or jump into job-scanner and duplication workflows."
      headerIcon={<LayoutTemplate className="h-6 w-6" />}
    >
      <div className="space-y-6">
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search templates..."
              className="w-full rounded-xl border border-white/10 bg-[#0d151d] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-[#1ECEFA]/40"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'PORTFOLIO', 'RESUME', 'COVER_LETTER'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  filter === item
                    ? 'border border-[#1ECEFA]/40 bg-[#1ECEFA]/15 text-[#1ECEFA]'
                    : 'border border-white/10 bg-black/20 text-slate-400 hover:text-white'
                }`}
              >
                {item === 'COVER_LETTER' ? 'Cover Letters' : item}
              </button>
            ))}
          </div>
        </div>

        {message ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            {message}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <Link
            href="/scanner"
            className="rounded-2xl border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 p-5 transition-colors hover:bg-[#1ECEFA]/15"
          >
            <div className="mb-3 flex items-center gap-2 text-[#1ECEFA]">
              <ScanSearch className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Job Scanner</span>
            </div>
            <p className="text-sm font-bold text-white">Match assets to job descriptions and auto-tailor duplicates.</p>
            <p className="mt-2 text-xs text-slate-300">Open scanner and run optimization workflow.</p>
          </Link>

          <Link
            href="/scanner"
            className="rounded-2xl border border-white/10 bg-black/20 p-5 transition-colors hover:border-[#1ECEFA]/40"
          >
            <div className="mb-3 flex items-center gap-2 text-slate-300">
              <GitFork className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Duplicator</span>
            </div>
            <p className="text-sm font-bold text-white">Duplicate an existing resume or cover letter for a specific role.</p>
            <p className="mt-2 text-xs text-slate-400">Use scanner duplication to create a tailored version instantly.</p>
          </Link>

          <Link
            href="/marketplace"
            className="rounded-2xl border border-white/10 bg-black/20 p-5 transition-colors hover:border-[#1ECEFA]/40"
          >
            <div className="mb-3 flex items-center gap-2 text-slate-300">
              <LayoutTemplate className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Marketplace</span>
            </div>
            <p className="text-sm font-bold text-white">Browse premium templates and publish your own.</p>
            <p className="mt-2 text-xs text-slate-400">Monetize your templates and manage purchases.</p>
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl border border-white/10 bg-black/20" />
            ))}
          </div>
        ) : visibleTemplates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-12 text-center">
            <p className="text-sm text-slate-400">No templates found for your filters.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTemplates.map((template) => (
              <article
                key={template.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 transition-colors hover:border-[#1ECEFA]/40"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    {normalizeCategoryLabel(template.category)}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500">{template.industry}</span>
                </div>
                <h2 className="line-clamp-2 text-base font-bold text-white">{template.name}</h2>
                <p className="mt-2 text-xs text-slate-500">
                  Added: {new Date(template.createdAt).toLocaleDateString()}
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleFork(template)}
                    disabled={forkingId === template.id}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#1ECEFA]/50 hover:text-white disabled:opacity-50"
                  >
                    <GitFork className="h-3.5 w-3.5" />
                    {forkingId === template.id ? 'Forking...' : 'Fork'}
                  </button>
                  <Link
                    href="/scanner"
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#1ECEFA]/50 hover:text-white"
                  >
                    Use Tool <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </FeaturePage>
  );
}
