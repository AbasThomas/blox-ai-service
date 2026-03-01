'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AssetType } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi } from '@/lib/api';
import { FileText } from 'lucide-react';

export default function ResumeNewPage() {
  const router = useRouter();
  const [title, setTitle] = useState('My Resume');
  const [targetRole, setTargetRole] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const finalTitle = targetRole.trim() ? `${title} - ${targetRole.trim()}` : title;
      const created = await assetsApi.create({
        type: AssetType.RESUME,
        title: finalTitle,
      }) as { id: string };

      router.push(`/resumes/${created.id}/edit`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create resume.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <FeaturePage
      title="New Resume"
      description="Create a new resume draft and jump straight into editing and ATS tailoring."
      headerIcon={<FileText className="h-6 w-6" />}
    >
      <div className="mx-auto max-w-xl space-y-4">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
            Resume Title
          </label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0d151d] px-3 py-2 text-sm text-white outline-none focus:border-[#1ECEFA]/40"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
            Target Role (Optional)
          </label>
          <input
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            placeholder="Frontend Engineer, Product Designer, Data Analyst..."
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
          disabled={creating || !title.trim()}
          className="rounded-xl bg-[#1ECEFA] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-white disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create Resume'}
        </button>
      </div>
    </FeaturePage>
  );
}
