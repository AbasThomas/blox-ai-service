'use client';

import { FeaturePage } from '@/components/shared/feature-page';
import { BriefcaseBusiness, ArrowLeft } from '@/components/ui/icons';
import Link from 'next/link';

export default function NewPortfolioPage() {
  return (
    <FeaturePage
      title="New Portfolio"
      description="Create a new professional showcase."
      headerIcon={<BriefcaseBusiness className="h-6 w-6" />}
    >
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/portfolios" className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Portfolios
          </Link>
        </div>
        <div className="bg-[#161B22]/50 border border-white/10 rounded-2xl md:rounded-[2.5rem] p-6 sm:p-8 md:p-10 backdrop-blur-md">
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase mb-2">Portfolio Configuration</h2>
          <p className="text-slate-400 mb-8">Define the structure and content of your new portfolio.</p>
          
          <form className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">Title</label>
              <input
                type="text"
                id="title"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1ECEFA]"
                placeholder="e.g. My Awesome Portfolio"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">Description</label>
              <textarea
                id="description"
                rows={4}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1ECEFA]"
                placeholder="A brief description of your portfolio."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#1ECEFA] px-6 py-3 text-sm font-black uppercase tracking-widest text-[#0C0F13] transition-all hover:bg-white hover:scale-[1.02]"
              >
                Create Portfolio
              </button>
              <Link
                href="/portfolios"
                className="w-full sm:w-auto text-center rounded-xl border border-white/10 bg-black/40 px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-300 transition-all hover:bg-white/5"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </FeaturePage>
  );
}
