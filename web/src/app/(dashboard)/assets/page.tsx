'use client';

import Link from 'next/link';
import { FeaturePage } from '@/components/shared/feature-page';
import { FileStack, LayoutDashboard, Search, Star, Clock, PlusCircle } from 'lucide-react';
import { useBloxStore } from '@/lib/store/app-store';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  PORTFOLIO: <LayoutDashboard className="h-4 w-4" />,
  RESUME: <Search className="h-4 w-4" />,
  COVER_LETTER: <Star className="h-4 w-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  PORTFOLIO: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
  RESUME: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  COVER_LETTER: 'border-[#1ECEFA]/30 text-[#1ECEFA] bg-[#1ECEFA]/10',
};

export default function AssetsPage() {
  const assets = useBloxStore((s) => s.assets);

  return (
    <FeaturePage 
      title="ASSET REPOSITORY" 
      description="Access, deploy, and manage your compiled portfolios, resumes, and cover letters from the central matrix."
      headerIcon={<FileStack className="h-6 w-6" />}
    >
      <div className="mb-8 flex items-center justify-end gap-3">
        <Link href="/portfolios/new" className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-[#1ECEFA] transition-all hover:bg-white/5 hover:border-[#1ECEFA]/50 shadow-inner">
           <span className="flex items-center gap-2"><PlusCircle className="h-4 w-4" /> NEW ASSET</span>
           <div className="absolute inset-x-0 bottom-0 h-[2px] w-full scale-x-0 bg-[#1ECEFA] transition-transform group-hover:scale-x-100" />
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {assets.length === 0 ? (
           <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-black/20 p-16 text-center backdrop-blur-sm">
             <FileStack className="mb-4 h-12 w-12 text-slate-600" strokeWidth={1.5} />
             <p className="font-display text-lg font-bold text-white">No Assets Detected</p>
             <p className="mt-2 max-w-sm text-sm text-slate-500 leading-relaxed">The repository is currently empty. Initiate a build sequence to compile your first portfolio node.</p>
             <Link href="/portfolios/new" className="mt-6 rounded-xl bg-[#1ECEFA] px-6 py-3 text-xs font-bold uppercase tracking-widest text-black shadow-[0_0_20px_rgba(30,206,250,0.3)] transition-all hover:bg-white hover:scale-105 active:scale-95">
               INITIATE BUILD 
             </Link>
           </div>
        ) : (
           assets.map((asset) => (
             <Link key={asset.id} href={`/${asset.type.toLowerCase().replace('_', '-')}s/${asset.id}/edit`}
               className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6 shadow-xl backdrop-blur-md transition-all hover:-translate-y-1 hover:border-white/30 hover:shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
               
               <div className="relative z-10 flex-1">
                 <div className="mb-4 flex items-start justify-between">
                   <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest shadow-inner ${TYPE_COLORS[asset.type]}`}>
                     {TYPE_ICONS[asset.type]} {asset.type.replace('_', ' ')}
                   </span>
                   {asset.publishedUrl && (
                     <span className="flex h-2 w-2 animate-pulse rounded-full bg-[#1ECEFA] shadow-[0_0_8px_rgba(30,206,250,0.8)]" />
                   )}
                 </div>
                 
                 <h3 className="font-display text-xl font-bold text-white transition-colors group-hover:text-[#1ECEFA]">{asset.title}</h3>
                 <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
                   No description provided. Contains structured professional data mapping.
                 </p>
               </div>

               <div className="relative z-10 mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                 <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                   <Clock className="h-3 w-3" />
                   {new Date(asset.updatedAt).toLocaleDateString()}
                 </p>
                 <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 shadow-inner transition-colors group-hover:bg-[#1ECEFA] group-hover:text-black group-hover:border-transparent">
                   <ArrowRight className="h-4 w-4" />
                 </div>
               </div>
               
               {/* Background Glow Effect on Hover */}
               <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
             </Link>
           ))
        )}
      </div>
    </FeaturePage>
  );
}

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
);
