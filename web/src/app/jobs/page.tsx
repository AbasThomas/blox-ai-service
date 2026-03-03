'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { useBloxStore } from '@/lib/store/app-store';
import { PlanTier } from '@nextjs-blox/shared-types';
import { Search, BriefcaseBusiness, Globe, Zap, ArrowUpRight, Check, MapPin, DollarSign, Filter, Bot } from '@/components/ui/icons';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  salary?: string;
  matchScore: number;
  postedAt: string;
  tags: string[];
}

// Mock data — replace with real jobsApi.search() when job board integration is ready
const MOCK_JOBS: Job[] = [
  { id: '1', title: 'Senior Frontend Engineer', company: 'Stripe', location: 'Remote', remote: true, salary: '$160k–$220k', matchScore: 91, postedAt: '2026-02-20', tags: ['React', 'TypeScript', 'GraphQL'] },
  { id: '2', title: 'Full-Stack Developer', company: 'Vercel', location: 'San Francisco, CA', remote: true, salary: '$140k–$190k', matchScore: 85, postedAt: '2026-02-22', tags: ['Next.js', 'Node.js', 'PostgreSQL'] },
  { id: '3', title: 'Staff Engineer', company: 'Linear', location: 'Remote', remote: true, salary: '$200k–$280k', matchScore: 78, postedAt: '2026-02-18', tags: ['React', 'Electron', 'Architecture'] },
  { id: '4', title: 'Backend Engineer', company: 'Supabase', location: 'Remote', remote: true, salary: '$120k–$160k', matchScore: 72, postedAt: '2026-02-24', tags: ['Go', 'PostgreSQL', 'Rust'] },
  { id: '5', title: 'Product Engineer', company: 'Loom', location: 'New York, NY', remote: false, salary: '$150k–$190k', matchScore: 68, postedAt: '2026-02-19', tags: ['React', 'Python', 'ML'] },
];

export default function JobsPage() {
  const user = useBloxStore((s) => s.user);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [tracked, setTracked] = useState<Set<string>>(new Set());

  const filtered = MOCK_JOBS.filter((j) => {
    if (query && !j.title.toLowerCase().includes(query.toLowerCase()) &&
        !j.company.toLowerCase().includes(query.toLowerCase())) return false;
    if (remoteOnly && !j.remote) return false;
    if (j.matchScore < minScore) return false;
    return true;
  });

  const scoreColor = (s: number) => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-amber-400' : 'text-red-400';
  const scoreBg = (s: number) => s >= 80 ? 'bg-green-500/10 border-green-500/20' : s >= 60 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';

  const handleTrack = (jobId: string) => {
    setTracked((prev) => {
      const next = new Set(prev);
      next.has(jobId) ? next.delete(jobId) : next.add(jobId);
      return next;
    });
  };

  return (
    <FeaturePage
      title="Job Matching"
      description="Advanced AI-driven alignment between your assets and open global roles."
      minTier={PlanTier.PRO}
      headerIcon={<BriefcaseBusiness className="h-6 w-6" />}
    >
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Filters Header */}
        <div className="flex flex-col lg:flex-row gap-4 p-4 md:p-6 rounded-2xl md:rounded-3xl bg-black/20 border border-white/5 backdrop-blur-md">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-[#1ECEFA] transition-colors" />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by role, company, or technical node..."
              className="w-full rounded-xl md:rounded-2xl border border-white/10 bg-white/5 pl-12 pr-5 py-3 md:py-4 text-sm text-white placeholder-slate-600 focus:border-[#1ECEFA]/50 focus:outline-none focus:ring-1 focus:ring-[#1ECEFA]/50 transition-all" 
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <label className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-xl md:rounded-2xl border border-white/10 bg-white/5 px-5 py-3 md:py-4 text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:border-white/20 transition-all">
              <input 
                type="checkbox" 
                checked={remoteOnly} 
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-black text-[#1ECEFA] focus:ring-[#1ECEFA]" 
              />
              Remote Only
            </label>
            <div className="relative group w-full sm:w-auto">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-[#1ECEFA] transition-colors" />
              <select 
                value={minScore} 
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full sm:w-auto rounded-xl md:rounded-2xl border border-white/10 bg-white/5 pl-12 pr-10 py-3 md:py-4 text-xs font-black uppercase tracking-widest text-slate-400 focus:border-[#1ECEFA]/50 focus:outline-none transition-all appearance-none"
              >
                <option value={0}>All Alignment Levels</option>
                <option value={60}>60%+ Match</option>
                <option value={75}>75%+ Match</option>
                <option value={85}>85%+ Match</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 px-2 md:px-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1ECEFA] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{filtered.length} Opportunities Identified</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{tracked.size} Strategic Targets</span>
          </div>
        </div>

        {/* Job Grid */}
        <div className="grid gap-4 md:gap-6">
          {filtered.map((job) => (
            <article 
              key={job.id} 
              className="group relative flex flex-col md:flex-row items-center gap-6 md:gap-8 overflow-hidden rounded-2xl md:rounded-[2rem] border border-white/10 bg-black/40 p-6 md:p-8 transition-all duration-300 hover:border-[#1ECEFA]/50 hover:bg-black/60 shadow-xl"
            >
              {/* Match alignment score */}
              <div className={`shrink-0 h-20 w-20 md:h-24 md:w-24 rounded-2xl md:rounded-3xl border flex flex-col items-center justify-center space-y-1 transition-all group-hover:scale-105 ${scoreBg(job.matchScore)}`}>
                <p className={`text-2xl md:text-3xl font-black leading-none tracking-tighter ${scoreColor(job.matchScore)}`}>{job.matchScore}</p>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Alignment</p>
              </div>

              <div className="flex-1 min-w-0 space-y-6 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="text-lg md:text-2xl font-black text-white tracking-tight uppercase group-hover:text-[#1ECEFA] transition-colors">{job.title}</h3>
                    <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> {job.company}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                      {job.salary && <span className="flex items-center gap-1.5 text-slate-400"><DollarSign className="h-3.5 w-3.5" /> {job.salary}</span>}
                    </div>
                  </div>
                  <time className="text-[9px] font-black text-slate-600 uppercase tracking-widest shrink-0">{new Date(job.postedAt).toLocaleDateString()}</time>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {job.remote && (
                    <span className="rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-green-400 flex items-center gap-1.5">
                      <Zap className="h-3 w-3 fill-current" /> Global Remote
                    </span>
                  )}
                  {job.tags.map((tag) => (
                    <span key={tag} className="rounded-lg bg-white/5 border border-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:border-white/10 transition-colors">{tag}</span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                  <button 
                    onClick={() => router.push(`/scanner?jobId=${job.id}`)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-[#1ECEFA] hover:shadow-md active:scale-95"
                  >
                    Scan & Tailor <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => handleTrack(job.id)}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                      tracked.has(job.id)
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tracked.has(job.id) ? <Check className="h-3.5 w-3.5" /> : null}
                    {tracked.has(job.id) ? 'Tracked' : 'Track Target'}
                  </button>
                  {user.tier === PlanTier.PREMIUM && (
                    <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:shadow-md transition-all">
                      <Bot className="h-3.5 w-3.5" /> Auto-Apply Protocol
                    </button>
                  )}
                </div>
              </div>
              
              {/* Background glow on hover */}
              <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[#1ECEFA]/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </article>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl md:rounded-[2.5rem] border-2 border-dashed border-white/5 bg-black/20 p-12 md:p-20 text-center">
              <div className="mb-6 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl md:rounded-3xl bg-white/5 text-slate-700">
                <Search className="h-8 w-8 md:h-10 md:w-10" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight uppercase">No Identical Alignment Detected</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-xs leading-relaxed">No opportunities match your current filters. Try expanding your search nodes or decreasing alignment minimums.</p>
              <button 
                onClick={() => { setQuery(''); setRemoteOnly(false); setMinScore(0); }}
                className="mt-8 rounded-xl md:rounded-2xl bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-[#1ECEFA] hover:shadow-md"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </FeaturePage>
  );
}

