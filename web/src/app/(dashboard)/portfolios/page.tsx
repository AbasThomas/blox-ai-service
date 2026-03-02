'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AssetType } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi } from '@/lib/api';
import { BriefcaseBusiness, PlusCircle, ArrowUpRight, BarChart3, Globe } from '@/components/ui/icons';

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
      description="Manage your professional showcases. Create, edit, and monitor your global presence."
      headerIcon={<BriefcaseBusiness className="h-6 w-6" />}
    >
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div className="space-y-1">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Active Archives</h2>
            <p className="text-xs text-slate-500">You have {portfolios.length} portfolio records stored in the cloud.</p>
          </div>
          <Link
            href="/portfolios/new"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1ECEFA] px-6 py-4 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-white hover:shadow-[0_0_20px_rgba(30,206,250,0.4)] active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            Initialize New Portfolio
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-[2rem] border border-white/10 bg-black/20" />
            ))}
          </div>
        ) : portfolios.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-white/10 bg-black/20 p-20 text-center backdrop-blur-sm">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-slate-700">
              <BriefcaseBusiness className="h-10 w-10" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase">No Portfolios Detected</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-xs leading-relaxed">Your professional archive is currently empty. Start building your digital presence now.</p>
            <Link 
              href="/portfolios/new" 
              className="mt-8 rounded-2xl bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-[#1ECEFA] hover:shadow-[0_0_25px_rgba(30,206,250,0.5)]"
            >
              START BUILDING
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((portfolio) => (
              <article
                key={portfolio.id}
                className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 p-1 transition-all duration-300 hover:border-[#1ECEFA]/50 hover:bg-black/60 shadow-xl"
              >
                <div className="flex flex-col h-full bg-black/40 rounded-[1.8rem] p-6">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="line-clamp-1 text-lg font-black text-white tracking-tight uppercase group-hover:text-[#1ECEFA] transition-colors">{portfolio.title}</h2>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Epoch: {formatDate(portfolio.updatedAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full bg-[#1ECEFA]/10 border border-[#1ECEFA]/20 px-3 py-1 text-[10px] font-black text-[#1ECEFA] uppercase tracking-widest">
                        {portfolio.healthScore ?? 0}% HEALTH
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${portfolio.publishedUrl ? 'bg-green-400 animate-pulse' : 'bg-slate-700'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {portfolio.publishedUrl ? 'ACTIVE PROTOCOL' : 'DRAFT STATE'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <Link
                      href={`/portfolios/${portfolio.id}/edit`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all hover:bg-white hover:text-black"
                    >
                      EDIT <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={`/preview/${portfolio.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all hover:bg-white hover:text-black"
                    >
                      {portfolio.publishedUrl ? 'PREVIEW' : 'PUBLISH'}
                    </Link>
                    <Link
                      href={`/analytics/${portfolio.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all hover:bg-white hover:text-black"
                    >
                      <BarChart3 className="h-3.5 w-3.5" /> ANALYTICS
                    </Link>
                    {portfolio.publishedUrl ? (
                      <a
                        href={portfolio.publishedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#1ECEFA] transition-all hover:bg-[#1ECEFA] hover:text-black"
                      >
                        <Globe className="h-3.5 w-3.5" /> LIVE
                      </a>
                    ) : (
                      <div className="inline-flex items-center justify-center rounded-xl border border-white/5 bg-white/2 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 cursor-not-allowed">
                        OFFLINE
                      </div>
                    )}
                  </div>
                </div>
                {/* Hover Glow */}
                <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-[#1ECEFA]/5 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </article>
            ))}
          </div>
        )}
      </div>
    </FeaturePage>
  );
}
