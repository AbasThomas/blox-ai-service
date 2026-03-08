'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { templatesApi } from '@/lib/api';
import { LayoutTemplate, Search, GitFork, ScanSearch, ArrowUpRight } from '@/components/ui/icons';

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
  return category.toUpperCase().includes(filter);
}

function normalizeCategoryLabel(category: string) {
  return category.replaceAll('_', ' ');
}

function editPathForForkedAsset(category: string, assetId: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes('resume')) return `/resumes/${assetId}/edit`;
  if (normalized.includes('cover')) return `/cover-letters/${assetId}/edit`;
  return `/portfolios/${assetId}/edit`;
}

const FILTERS: { key: CategoryFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PORTFOLIO', label: 'Portfolio' },
  { key: 'RESUME', label: 'Resume' },
  { key: 'COVER_LETTER', label: 'Cover Letter' },
];

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
      const data = await templatesApi.list({ search: search.trim() });
      setTemplates(Array.isArray(data) ? (data as TemplateItem[]) : []);
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
      description="Browse and fork templates, or jump into job-scanner and duplication workflows."
    >
      <div className="space-y-6">
        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#4E5C6E]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full h-9 rounded border border-[#1B2131] bg-[#0B0E14] py-0 pl-9 pr-3 text-[13px] text-white placeholder-[#3A4452] outline-none focus:border-[#2A3A50] transition-colors"
            />
          </div>
          <div className="flex items-center h-9 rounded border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`h-9 px-3 text-[12px] font-medium transition-colors border-r border-[#1B2131] last:border-r-0 ${
                  filter === item.key ? 'bg-[#141C28] text-white' : 'text-[#46566A] hover:text-[#8899AA]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className="rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-300">
            {message}
          </div>
        )}

        {/* Tool cards */}
        <div className="grid gap-3 lg:grid-cols-3">
          <Link
            href="/scanner"
            className="group rounded-md border border-[#1ECEFA]/20 bg-[#0B0E14] p-4 hover:border-[#1ECEFA]/40 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <ScanSearch size={14} className="text-[#1ECEFA]" />
              <span className="text-[12px] font-semibold text-[#1ECEFA]">Job Scanner</span>
            </div>
            <p className="text-[13px] font-medium text-white">Match assets to job descriptions and auto-tailor.</p>
            <p className="mt-1.5 text-[11px] text-[#4E5C6E]">Run optimization workflows against any job posting.</p>
          </Link>

          <Link
            href="/scanner"
            className="group rounded-md border border-[#1B2131] bg-[#0B0E14] p-4 hover:border-[#2A3A50] transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <GitFork size={14} className="text-[#7A8DA0]" />
              <span className="text-[12px] font-semibold text-[#7A8DA0]">Duplicator</span>
            </div>
            <p className="text-[13px] font-medium text-white">Duplicate a resume or cover letter for a specific role.</p>
            <p className="mt-1.5 text-[11px] text-[#4E5C6E]">Create a tailored version instantly via the scanner.</p>
          </Link>

          <Link
            href="/marketplace"
            className="group rounded-md border border-[#1B2131] bg-[#0B0E14] p-4 hover:border-[#2A3A50] transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <LayoutTemplate size={14} className="text-[#7A8DA0]" />
              <span className="text-[12px] font-semibold text-[#7A8DA0]">Marketplace</span>
            </div>
            <p className="text-[13px] font-medium text-white">Browse premium templates and publish your own.</p>
            <p className="mt-1.5 text-[11px] text-[#4E5C6E]">Monetize your templates and manage purchases.</p>
          </Link>
        </div>

        {/* Template grid */}
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-md border border-[#1B2131] bg-[#0B0E14]" />
            ))}
          </div>
        ) : visibleTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[#1B2131] p-12 text-center gap-2">
            <LayoutTemplate size={22} className="text-[#2E3847]" />
            <p className="text-[13px] text-[#4E5C6E]">No templates found for your filters.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTemplates.map((template) => (
              <article
                key={template.id}
                className="rounded-md border border-[#1B2131] bg-[#0B0E14] p-4 hover:border-[#2A3A50] transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[10px] uppercase text-[#4E5C6E] tracking-wide">
                    {normalizeCategoryLabel(template.category)}
                  </span>
                  <span className="text-[10px] text-[#3A4452]">{template.industry}</span>
                </div>
                <h2 className="text-[14px] font-semibold text-white leading-snug line-clamp-2">{template.name}</h2>
                <p className="mt-2 font-mono text-[10px] text-[#3A4452]">
                  Added {new Date(template.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleFork(template)}
                    disabled={forkingId === template.id}
                    className="flex-1 inline-flex items-center justify-center gap-1 h-7 rounded border border-[#1B2131] text-[11px] text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] disabled:opacity-40 transition-colors"
                  >
                    <GitFork size={11} />
                    {forkingId === template.id ? 'Forking...' : 'Fork'}
                  </button>
                  <Link
                    href="/scanner"
                    className="flex-1 inline-flex items-center justify-center gap-1 h-7 rounded border border-[#1B2131] text-[11px] text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] transition-colors"
                  >
                    Use Tool <ArrowUpRight size={11} />
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
