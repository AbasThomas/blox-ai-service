'use client';

import { FeaturePage } from '@/components/shared/feature-page';
import { LayoutTemplate, Eye, Download } from 'lucide-react';
import Link from 'next/link';

const TEMPLATES = [
  { id: '1', name: 'CYBER-PUNK v1', category: 'Portfolio', popularity: 98, isPro: true, color: 'from-purple-500/20 to-[#1ECEFA]/20' },
  { id: '2', name: 'NEO-MINIMAL', category: 'Resume', popularity: 85, isPro: false, color: 'from-slate-500/20 to-white/5' },
  { id: '3', name: 'GLASS-MORPH', category: 'Cover Letter', popularity: 92, isPro: false, color: 'from-blue-500/20 to-indigo-500/20' },
  { id: '4', name: 'TERMINAL PRO', category: 'Portfolio', popularity: 99, isPro: true, color: 'from-green-500/20 to-[#1ECEFA]/10' },
];

export default function TemplatesPage() {
  return (
    <FeaturePage 
      title="TEMPLATE SCHEMATICS" 
      description="Select pre-compiled architectural blueprints for your personal nodes. PRO tier grants access to advanced visual matrices."
      headerIcon={<LayoutTemplate className="h-6 w-6" />}
    >
      <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex gap-4">
          <button className="text-xs font-bold text-[#1ECEFA] tracking-widest uppercase border-b-2 border-[#1ECEFA] pb-1">All Schematics</button>
          <button className="text-xs font-bold text-slate-500 hover:text-white tracking-widest uppercase transition-colors">Portfolios</button>
          <button className="text-xs font-bold text-slate-500 hover:text-white tracking-widest uppercase transition-colors">Resumes</button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TEMPLATES.map((tpl) => (
          <div key={tpl.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-xl backdrop-blur-md transition-all hover:-translate-y-2 hover:border-[#1ECEFA]/40 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
            
            {/* Visual Preview Block */}
            <div className={`aspect-[4/3] w-full bg-gradient-to-br ${tpl.color} p-4 flex flex-col`}>
              {tpl.isPro && (
                 <span className="self-end rounded-full border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-purple-400 backdrop-blur-md">
                   PRO ONLY
                 </span>
              )}
              {/* Fake wireframe elements */}
              <div className="mt-auto space-y-2 opacity-50 transition-opacity group-hover:opacity-100">
                <div className="h-2 w-1/3 rounded-full bg-white/20" />
                <div className="h-2 w-2/3 rounded-full bg-white/20" />
                <div className="h-2 w-1/2 rounded-full bg-white/20" />
              </div>
            </div>

            {/* Content Info */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{tpl.category}</span>
                <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                  <Download className="h-3 w-3" /> {tpl.popularity}k
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-white transition-colors group-hover:text-[#1ECEFA]">{tpl.name}</h3>
              
              <div className="mt-6 flex gap-2">
                <Link href="#" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white hover:text-black">
                  <Eye className="h-3 w-3" /> Preview
                </Link>
                <Link href={`/${tpl.category.toLowerCase().replace(' ', '-')}s/new`} className="flex flex-1 items-center justify-center rounded-xl bg-[#1ECEFA] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-black shadow-lg transition-all hover:bg-white hover:text-[#1ECEFA] hover:shadow-[0_0_15px_rgba(30,206,250,0.4)]">
                  Deploy
                </Link>
              </div>
            </div>
            
            <div className="absolute inset-x-0 bottom-0 h-[2px] w-full scale-x-0 bg-gradient-to-r from-transparent via-[#1ECEFA] to-transparent transition-transform duration-500 group-hover:scale-x-100 opacity-50" />
          </div>
        ))}

        {/* Create Custom Card */}
        <Link href="/portfolios/new" className="group flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/20 p-8 text-center backdrop-blur-md transition-all hover:-translate-y-2 hover:border-[#1ECEFA]/50 hover:bg-[#1ECEFA]/5">
           <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 transition-transform group-hover:scale-110 group-hover:bg-[#1ECEFA]/20 group-hover:text-[#1ECEFA] text-slate-500">
             <LayoutTemplate className="h-8 w-8" />
           </div>
           <p className="font-display text-lg font-bold text-white transition-colors group-hover:text-[#1ECEFA]">Generate Custom</p>
           <p className="mt-2 text-xs text-slate-500 max-w-[150px] leading-relaxed">Let AI compile a unique schema based on your data.</p>
        </Link>
      </div>
    </FeaturePage>
  );
}
