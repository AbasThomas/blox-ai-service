'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi, templatesApi } from '@/lib/api';

const ROLES = ['Software Engineer', 'Product Designer', 'Data Scientist', 'Marketing Manager',
  'DevOps Engineer', 'Product Manager', 'Fullstack Developer', 'UX Researcher'];

const STEPS = ['Role & style', 'Import data', 'Generate', 'Done'] as const;
type Step = 0 | 1 | 2 | 3;

export default function PortfolioNewPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [role, setRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [importSource, setImportSource] = useState<'manual' | 'github' | 'linkedin'>('manual');
  const [assetId, setAssetId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const selectedRole = role === 'custom' ? customRole : role;

  const handleCreate = async () => {
    if (!selectedRole) { setError('Please select or enter a role.'); return; }
    setError('');
    setGenerating(true);
    try {
      const asset = await assetsApi.create({
        type: 'PORTFOLIO',
        title: `${selectedRole} Portfolio`,
        templateId: templateId || undefined,
      }) as { id: string };
      setAssetId(asset.id);

      // Trigger AI generation
      await assetsApi.generate?.(asset.id, `Generate a professional portfolio for a ${selectedRole}`) ?? Promise.resolve();
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create portfolio.');
    } finally {
      setGenerating(false);
    }
  };

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333';

  return (
    <FeaturePage title="New Portfolio" description="Set up your AI-generated portfolio in a few quick steps.">
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              i < step ? 'bg-green-500 text-white' :
              i === step ? 'bg-slate-900 text-white' :
              'bg-slate-100 text-slate-400'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`ml-2 text-sm font-medium hidden sm:inline ${i === step ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="mx-3 flex-1 h-px bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* Step 0: Role & Style */}
      {step === 0 && (
        <div className="max-w-2xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-3">What is your role?</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ROLES.map((r) => (
                <button key={r} type="button" onClick={() => { setRole(r); setCustomRole(''); }}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-medium text-left transition-colors ${
                    role === r ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-400'
                  }`}>
                  {r}
                </button>
              ))}
              <button type="button" onClick={() => setRole('custom')}
                className={`rounded-lg border px-3 py-2.5 text-xs font-medium text-left transition-colors ${
                  role === 'custom' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-400'
                }`}>
                Other...
              </button>
            </div>
            {role === 'custom' && (
              <input value={customRole} onChange={(e) => setCustomRole(e.target.value)} placeholder="Enter your role"
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            )}
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 mb-3">Template style (optional)</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[{ id: '', label: 'Let AI decide', desc: 'Best fit based on your role' },
                { id: 'minimal', label: 'Minimal', desc: 'Clean, text-focused' },
                { id: 'creative', label: 'Creative', desc: 'Bold colors, visual-heavy' }].map((t) => (
                <button key={t.id} type="button" onClick={() => setTemplateId(t.id)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    templateId === t.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <p className="text-sm font-semibold text-slate-900">{t.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={() => { if (!selectedRole) { setError('Please select a role.'); return; } setError(''); setStep(1); }}
            className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
            Continue
          </button>
        </div>
      )}

      {/* Step 1: Import data */}
      {step === 1 && (
        <div className="max-w-lg space-y-6">
          <h2 className="text-base font-bold text-slate-900">Import your existing data</h2>
          <div className="grid gap-3">
            {[
              { id: 'manual' as const, label: 'Start from scratch', desc: 'AI will generate based on your role only.' },
              { id: 'github' as const, label: 'Import from GitHub', desc: 'Pull your repos, languages, and contributions.' },
              { id: 'linkedin' as const, label: 'Import from LinkedIn', desc: 'Pull your experience and skills.' },
            ].map((src) => (
              <button key={src.id} type="button" onClick={() => setImportSource(src.id)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  importSource === src.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                }`}>
                <p className="text-sm font-semibold text-slate-900">{src.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{src.desc}</p>
              </button>
            ))}
          </div>

          {importSource === 'github' && (
            <a href={`${apiBase}/v1/auth/github`}
              className="block rounded-md bg-slate-800 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-slate-700">
              Connect GitHub
            </a>
          )}
          {importSource === 'linkedin' && (
            <a href={`${apiBase}/v1/auth/linkedin`}
              className="block rounded-md bg-blue-700 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-blue-800">
              Connect LinkedIn
            </a>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(0)}
              className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Back
            </button>
            <button onClick={() => setStep(2)}
              className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Generate */}
      {step === 2 && (
        <div className="max-w-lg space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Ready to generate</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Role</dt>
                <dd className="font-medium text-slate-900">{selectedRole}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Style</dt>
                <dd className="font-medium text-slate-900">{templateId || 'AI-selected'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Data source</dt>
                <dd className="font-medium text-slate-900 capitalize">{importSource}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            AI generation typically takes 30–120 seconds. You will be notified when ready.
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} disabled={generating}
              className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              Back
            </button>
            <button onClick={handleCreate} disabled={generating}
              className="flex-1 rounded-md bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
              {generating ? 'Creating...' : 'Generate with AI'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && (
        <div className="max-w-lg text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Portfolio created!</h2>
            <p className="mt-2 text-sm text-slate-600">
              AI is generating your content in the background. Head to the editor to review and customise.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => router.push(`/portfolios/${assetId}/edit`)}
              className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
              Open editor
            </button>
            <button onClick={() => router.push('/dashboard')}
              className="rounded-md border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Go to dashboard
            </button>
          </div>
        </div>
      )}
    </FeaturePage>
  );
}
