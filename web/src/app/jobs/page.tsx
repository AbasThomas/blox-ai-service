'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { useBloxStore } from '@/lib/store/app-store';
import { PlanTier } from '@nextjs-blox/shared-types';

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
  { id: '1', title: 'Senior Frontend Engineer', company: 'Stripe', location: 'Remote', remote: true, salary: '$160k–$220k', matchScore: 91, postedAt: '2025-02-20', tags: ['React', 'TypeScript', 'GraphQL'] },
  { id: '2', title: 'Full-Stack Developer', company: 'Vercel', location: 'San Francisco, CA', remote: true, salary: '$140k–$190k', matchScore: 85, postedAt: '2025-02-22', tags: ['Next.js', 'Node.js', 'PostgreSQL'] },
  { id: '3', title: 'Staff Engineer', company: 'Linear', location: 'Remote', remote: true, salary: '$200k–$280k', matchScore: 78, postedAt: '2025-02-18', tags: ['React', 'Electron', 'Architecture'] },
  { id: '4', title: 'Backend Engineer', company: 'Supabase', location: 'Remote', remote: true, salary: '$120k–$160k', matchScore: 72, postedAt: '2025-02-24', tags: ['Go', 'PostgreSQL', 'Rust'] },
  { id: '5', title: 'Product Engineer', company: 'Loom', location: 'New York, NY', remote: false, salary: '$150k–$190k', matchScore: 68, postedAt: '2025-02-19', tags: ['React', 'Python', 'ML'] },
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

  const scoreColor = (s: number) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-amber-600' : 'text-red-600';
  const scoreBg = (s: number) => s >= 80 ? 'bg-green-100' : s >= 60 ? 'bg-amber-100' : 'bg-red-100';

  const handleTrack = (jobId: string) => {
    setTracked((prev) => {
      const next = new Set(prev);
      next.has(jobId) ? next.delete(jobId) : next.add(jobId);
      return next;
    });
  };

  return (
    <FeaturePage
      title="Job matching"
      description="Browse AI-matched jobs. See your fit score and track applications."
      minTier={PlanTier.PRO}
    >
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row mb-6">
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Role, company, or skill..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)}
              className="rounded" />
            Remote only
          </label>
          <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value={0}>All match scores</option>
            <option value={60}>60%+</option>
            <option value={75}>75%+</option>
            <option value={85}>85%+</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <span className="text-slate-500">{filtered.length} jobs found</span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-500">{tracked.size} tracked</span>
      </div>

      {/* Job list */}
      <div className="space-y-3">
        {filtered.map((job) => (
          <div key={job.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              {/* Match score */}
              <div className={`shrink-0 h-14 w-14 rounded-xl flex flex-col items-center justify-center ${scoreBg(job.matchScore)}`}>
                <p className={`text-lg font-black leading-none ${scoreColor(job.matchScore)}`}>{job.matchScore}</p>
                <p className="text-xs text-slate-400">match</p>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{job.title}</h3>
                    <p className="text-sm text-slate-600">{job.company} · {job.location}</p>
                  </div>
                  {job.salary && (
                    <span className="shrink-0 text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-2 py-1">{job.salary}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {job.remote && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Remote</span>
                  )}
                  {job.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{tag}</span>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => router.push(`/scanner?jobId=${job.id}`)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    Scan &amp; tailor
                  </button>
                  <button onClick={() => handleTrack(job.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                      tracked.has(job.id)
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}>
                    {tracked.has(job.id) ? '✓ Tracked' : 'Track'}
                  </button>
                  {user.tier === PlanTier.PREMIUM && (
                    <button className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700">
                      Auto-apply
                    </button>
                  )}
                  <span className="ml-auto text-xs text-slate-400">
                    {new Date(job.postedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-sm">No jobs match your filters. Try widening your search.</p>
          </div>
        )}
      </div>
    </FeaturePage>
  );
}
