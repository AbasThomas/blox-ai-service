'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { templatesApi } from '@/lib/api';

const CATEGORIES = ['All', 'Portfolio', 'Resume', 'Cover Letter'];
const INDUSTRIES = ['All', 'Tech', 'Design', 'Finance', 'Marketing', 'Healthcare'];

interface Template {
  id: string;
  name: string;
  category: string;
  industry: string;
  description: string;
  previewUrl?: string;
  forkCount: number;
  rating: number;
  isPremium: boolean;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [industry, setIndustry] = useState('All');
  const [forking, setForking] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (category !== 'All') params.category = category.toUpperCase().replace(' ', '_');
    if (industry !== 'All') params.industry = industry.toUpperCase();
    templatesApi.list(params)
      .then((data) => setTemplates(data as Template[]))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [search, category, industry]);

  const handleFork = async (templateId: string) => {
    setForking(templateId);
    try {
      const asset = await templatesApi.fork(templateId) as { id: string; type: string };
      router.push(`/${asset.type.toLowerCase().replace('_', '-')}s/${asset.id}/edit`);
    } catch { /* ignore */ }
    finally { setForking(null); }
  };

  return (
    <FeaturePage title="Template library" description="Browse 8,100+ templates. Fork to customise and publish to the marketplace.">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row mb-6">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by role, industry, style..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={industry} onChange={(e) => setIndustry(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
          {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
          <p className="text-4xl mb-2">🗂️</p>
          <p className="text-sm">No templates match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <article key={t.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Preview area */}
              <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                {t.previewUrl ? (
                  <img src={t.previewUrl} alt={t.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl">{t.category === 'PORTFOLIO' ? '🎨' : t.category === 'RESUME' ? '📄' : '✉️'}</span>
                )}
                {t.isPremium && (
                  <span className="absolute top-2 right-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-900">PRO</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-sm text-slate-900 leading-tight">{t.name}</h3>
                  <span className="ml-2 shrink-0 text-xs text-amber-500 font-medium">★ {t.rating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{t.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{t.forkCount.toLocaleString()} forks</span>
                  <button onClick={() => handleFork(t.id)} disabled={forking === t.id}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50">
                    {forking === t.id ? '...' : 'Use template'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </FeaturePage>
  );
}
