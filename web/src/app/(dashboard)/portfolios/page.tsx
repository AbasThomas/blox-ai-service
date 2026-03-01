'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AssetType } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi } from '@/lib/api';
import { BriefcaseBusiness, PlusCircle, ArrowUpRight, BarChart3, Globe } from 'lucide-react';

interface PortfolioAsset {
  id: string;
  title: string;
  type: AssetType;
  healthScore?: number | null;
  publishedUrl?: string | null;
  updatedAt: string;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString();
}

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<PortfolioAsset[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <FeaturePage
      title="Portfolios"
      description="Manage all portfolios in one place. Create, edit, publish, and monitor analytics per portfolio."
      headerIcon={<BriefcaseBusiness className="h-6 w-6" />}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-widest text-slate-500">
            Total portfolios: <span className="font-bold text-white">{portfolios.length}</span>
          </div>
          <Link
            href="/portfolios/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1ECEFA] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-white"
          >
            <PlusCircle className="h-4 w-4" />
            Create New Portfolio
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl border border-white/10 bg-black/20" />
            ))}
          </div>
        ) : portfolios.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-12 text-center">
            <p className="text-sm text-slate-400">No portfolios yet. Create your first portfolio to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((portfolio) => (
              <article
                key={portfolio.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 transition-colors hover:border-[#1ECEFA]/40"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="line-clamp-2 text-base font-bold text-white">{portfolio.title}</h2>
                  <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-300">
                    {portfolio.healthScore ?? 0}%
                  </span>
                </div>

                <p className="text-xs text-slate-500">Updated: {formatDate(portfolio.updatedAt)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Status: {portfolio.publishedUrl ? 'Published' : 'Draft'}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/portfolios/${portfolio.id}/edit`}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#1ECEFA]/50 hover:text-white"
                  >
                    Edit <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/preview/${portfolio.id}`}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#1ECEFA]/50 hover:text-white"
                  >
                    {portfolio.publishedUrl ? 'Preview' : 'Publish'}
                  </Link>
                  <Link
                    href={`/analytics/${portfolio.id}`}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#1ECEFA]/50 hover:text-white"
                  >
                    <BarChart3 className="h-3.5 w-3.5" /> Analytics
                  </Link>
                  {portfolio.publishedUrl ? (
                    <a
                      href={portfolio.publishedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#1ECEFA]/50 hover:text-white"
                    >
                      <Globe className="h-3.5 w-3.5" /> Live
                    </a>
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-lg border border-white/5 px-3 py-2 text-xs text-slate-500">
                      Not live yet
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </FeaturePage>
  );
}
