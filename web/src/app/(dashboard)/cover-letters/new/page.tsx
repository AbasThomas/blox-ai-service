'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AssetType } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi } from '@/lib/api';
import { Mail } from 'lucide-react';

export default function CoverLetterNewPage() {
  const router = useRouter();
  const [title, setTitle] = useState('My Cover Letter');
  const [jobUrl, setJobUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const created = await assetsApi.create({
        type: AssetType.COVER_LETTER,
        title: title.trim() || 'My Cover Letter',
      }) as { id: string };

      const nextUrl = jobUrl.trim()
        ? `/cover-letters/${created.id}/edit?jobUrl=${encodeURIComponent(jobUrl.trim())}`
        : `/cover-letters/${created.id}/edit`;

      router.push(nextUrl);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create cover letter.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <FeaturePage
      title="New Cover Letter"
      description="Start a fresh cover letter and optionally attach a job posting URL for tailored generation."
      headerIcon={<Mail className="h-6 w-6" />}
    >
      <div className="mx-auto max-w-xl space-y-4">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
            Cover Letter Title
          </label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0d151d] px-3 py-2 text-sm text-white outline-none focus:border-[#1ECEFA]/40"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
            Job URL (Optional)
          </label>
          <input
            value={jobUrl}
            onChange={(event) => setJobUrl(event.target.value)}
            placeholder="https://company.com/jobs/frontend-engineer"
            className="w-full rounded-xl border border-white/10 bg-[#0d151d] px-3 py-2 text-sm text-white outline-none focus:border-[#1ECEFA]/40"
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="rounded-xl bg-[#1ECEFA] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-white disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create Cover Letter'}
        </button>
      </div>
    </FeaturePage>
  );
}
