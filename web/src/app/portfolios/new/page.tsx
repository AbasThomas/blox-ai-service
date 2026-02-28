'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Persona } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { integrationsApi, onboardingApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';

type Step = 0 | 1 | 2 | 3 | 4;
type Provider =
  | 'linkedin'
  | 'github'
  | 'upwork'
  | 'fiverr'
  | 'behance'
  | 'dribbble'
  | 'figma'
  | 'coursera';

interface IntegrationItem {
  id: Provider;
  name: string;
  category: string;
  mode: 'oauth' | 'token' | 'manual';
  connected: boolean;
  authUrl: string | null;
  priority: 'primary' | 'secondary' | 'optional';
}

interface ImportStatus {
  runId: string;
  status: 'queued' | 'running' | 'awaiting_review' | 'completed' | 'failed' | 'partial';
  progressPct: number;
  message?: string;
  draftAssetId?: string;
}

interface ImportConflict {
  field: string;
  recommendedProvider: string;
  recommendedValue: string;
  candidates: Array<{ provider: string; value: string }>;
}

const PERSONA_OPTIONS = [
  { value: Persona.FREELANCER, label: 'Freelancer', desc: 'Confident, conversion-focused positioning' },
  { value: Persona.JOB_SEEKER, label: 'Job Seeker', desc: 'Recruiter-friendly narrative and achievements' },
  { value: Persona.DESIGNER, label: 'Designer', desc: 'Gallery-first structure and visuals' },
  { value: Persona.DEVELOPER, label: 'Developer', desc: 'Projects and technical credibility first' },
  { value: Persona.STUDENT, label: 'Student', desc: 'Growth-oriented story and learning outcomes' },
  { value: Persona.EXECUTIVE, label: 'Executive', desc: 'Leadership impact and strategic outcomes' },
] as const;

const STEPS = ['Persona', 'Connect Accounts', 'Auto-Generate', 'Review Merge', 'Done'] as const;

const DEFAULT_PROVIDER_ORDER: Provider[] = [
  'linkedin',
  'github',
  'upwork',
  'fiverr',
  'behance',
  'dribbble',
  'figma',
  'coursera',
];

function sortByPriority(items: IntegrationItem[]) {
  const rank = { primary: 0, secondary: 1, optional: 2 };
  return [...items].sort((a, b) => rank[a.priority] - rank[b.priority]);
}

function connectedProviders(items: IntegrationItem[]) {
  return items.filter((item) => item.connected).map((item) => item.id);
}

export default function PortfolioNewPage() {
  const router = useRouter();
  const user = useBloxStore((state) => state.user);
  const [step, setStep] = useState<Step>(0);
  const [persona, setPersona] = useState<Persona | `${Persona}`>(
    (user.persona as Persona | `${Persona}`) ?? Persona.JOB_SEEKER,
  );
  const [personalSiteUrl, setPersonalSiteUrl] = useState('');
  const [locationHint, setLocationHint] = useState('');
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [runId, setRunId] = useState('');
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [statusError, setStatusError] = useState('');
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [conflicts, setConflicts] = useState<ImportConflict[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);

  const selectedProviders = useMemo(
    () => connectedProviders(integrations).filter((provider) => DEFAULT_PROVIDER_ORDER.includes(provider)),
    [integrations],
  );

  const loadIntegrations = useCallback(async () => {
    setLoadingIntegrations(true);
    try {
      const rows = (await integrationsApi.list()) as IntegrationItem[];
      setIntegrations(sortByPriority(rows));
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Failed to load integrations');
    } finally {
      setLoadingIntegrations(false);
    }
  }, []);

  useEffect(() => {
    if (step === 1) loadIntegrations();
  }, [step, loadIntegrations]);

  useEffect(() => {
    if (!runId || step < 2 || step > 3) return;
    const timer = setInterval(async () => {
      try {
        const next = (await onboardingApi.getImportStatus(runId)) as ImportStatus;
        setStatus(next);

        if (next.status === 'awaiting_review' || next.status === 'partial') {
          const previewRes = (await onboardingApi.getImportPreview(runId)) as {
            preview?: Record<string, unknown>;
          };
          const nextPreview = previewRes.preview ?? null;
          setPreview(nextPreview);
          const conflictRows = Array.isArray((nextPreview as any)?.conflicts)
            ? ((nextPreview as any).conflicts as ImportConflict[])
            : [];
          setConflicts(conflictRows);
          if (step !== 3) setStep(3);
        }

        if (next.status === 'completed' && next.draftAssetId) {
          setStep(4);
        }
      } catch {
        // keep polling
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [runId, step]);

  const handleConnect = async (provider: Provider) => {
    try {
      const res = (await integrationsApi.connect(provider)) as { authUrl?: string | null; mode?: string };
      if (res.authUrl) {
        window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333'}${res.authUrl}`;
        return;
      }

      setStatusError(
        `Provider ${provider} currently requires ${res.mode === 'manual' ? 'manual' : 'token'} fallback. Continue and use fallback fields.`,
      );
      setIntegrations((prev) => prev.map((item) => (item.id === provider ? { ...item, connected: true } : item)));
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Failed to connect provider');
    }
  };

  const handleDisconnect = async (provider: Provider) => {
    try {
      await integrationsApi.disconnect(provider);
      setIntegrations((prev) => prev.map((item) => (item.id === provider ? { ...item, connected: false } : item)));
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Failed to disconnect provider');
    }
  };

  const startImport = async () => {
    setStatusError('');
    if (selectedProviders.length === 0) {
      setStatusError('Connect at least one provider, or connect manually in the next step.');
      return;
    }

    try {
      const res = (await onboardingApi.startImport({
        persona,
        providers: selectedProviders,
        personalSiteUrl: personalSiteUrl || undefined,
        locationHint: locationHint || undefined,
      })) as ImportStatus;

      setRunId(res.runId);
      setStatus(res);
      setStep(2);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Failed to start import');
    }
  };

  const applyRecommendedConflictValues = useCallback(() => {
    const next: Record<string, string> = {};
    for (const conflict of conflicts) {
      next[conflict.field] = conflict.recommendedValue;
    }
    setOverrides(next);
  }, [conflicts]);

  useEffect(() => {
    if (conflicts.length > 0) applyRecommendedConflictValues();
  }, [conflicts, applyRecommendedConflictValues]);

  const confirmImport = async () => {
    if (!runId) return;
    setConfirming(true);
    setStatusError('');
    try {
      const res = (await onboardingApi.confirmImport(runId, {
        overrides,
        acceptAutoMerge: true,
      })) as { draftAssetId?: string | null };

      setStep(4);
      const assetId = res.draftAssetId ?? status?.draftAssetId;
      if (assetId) {
        router.push(`/portfolios/${assetId}/edit`);
      }
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Failed to confirm import');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <FeaturePage title="Build Your Portfolio in 2 Minutes" description="Connect accounts, auto-generate draft, review merge, and publish.">
      <div className="mb-8 flex items-center gap-0">
        {STEPS.map((label, index) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              index < step ? 'bg-green-500 text-white' : index === step ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {index + 1}
            </div>
            <span className={`ml-2 hidden text-sm font-medium sm:inline ${index === step ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
            {index < STEPS.length - 1 ? <div className="mx-3 h-px flex-1 bg-slate-200" /> : null}
          </div>
        ))}
      </div>

      {step === 0 ? (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-base font-bold text-slate-900">Choose your persona</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {PERSONA_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPersona(option.value)}
                  className={`rounded-xl border p-4 text-left ${
                    persona === option.value ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-700">
              Personal site URL (optional)
              <input
                value={personalSiteUrl}
                onChange={(e) => setPersonalSiteUrl(e.target.value)}
                placeholder="https://yourdomain.com"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="text-sm text-slate-700">
              Location hint (optional)
              <input
                value={locationHint}
                onChange={(e) => setLocationHint(e.target.value)}
                placeholder="Lagos, Nigeria"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <button
            onClick={() => setStep(1)}
            className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
          >
            Continue
          </button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            We only read public/profile data — never post or modify anything.
          </div>

          {loadingIntegrations ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {integrations.map((integration) => (
                <div key={integration.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{integration.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      integration.connected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {integration.connected ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-slate-500 capitalize">{integration.priority} • {integration.category}</p>
                  {integration.connected ? (
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration.id)}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                    >
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-600">
            Partial connects are fine. You can skip any provider and still generate a draft with manual fallback data.
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Back
            </button>
            <button onClick={startImport} className="rounded-md bg-slate-900 px-6 py-2 text-sm font-bold text-white hover:bg-slate-700">
              Start AI Import
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-900">Auto-generating your portfolio draft</p>
            <p className="mt-1 text-xs text-slate-500">Import run: {runId}</p>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${status?.progressPct ?? 5}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-600">{status?.message ?? 'Working through provider imports and AI refinement...'}</p>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-bold text-slate-900">Review merge conflicts</h2>
            <p className="text-sm text-slate-600">Recommended values are prefilled. Override any field before finalizing.</p>
            {conflicts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No merge conflicts detected. You can finalize now.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {conflicts.map((conflict) => (
                  <div key={conflict.field} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-900 capitalize">{conflict.field}</p>
                    <p className="text-xs text-slate-500">Recommended source: {conflict.recommendedProvider}</p>
                    <input
                      value={overrides[conflict.field] ?? ''}
                      onChange={(e) => setOverrides((prev) => ({ ...prev, [conflict.field]: e.target.value }))}
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Back
            </button>
            <button
              onClick={confirmImport}
              disabled={confirming}
              className="rounded-md bg-slate-900 px-6 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {confirming ? 'Finalizing...' : 'Finalize Draft'}
            </button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <span className="text-3xl text-green-600">OK</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Draft portfolio ready</h2>
            <p className="text-sm text-slate-600">Your imported draft has been generated and is ready for drag-and-drop refinement.</p>
          </div>
          <div className="flex justify-center gap-3">
            {status?.draftAssetId ? (
              <button
                onClick={() => router.push(`/portfolios/${status.draftAssetId}/edit`)}
                className="rounded-md bg-slate-900 px-6 py-2 text-sm font-bold text-white hover:bg-slate-700"
              >
                Open editor
              </button>
            ) : null}
            <button onClick={() => router.push('/dashboard')} className="rounded-md border border-slate-300 px-6 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Dashboard
            </button>
          </div>
        </div>
      ) : null}

      {statusError ? (
        <p className="mt-4 text-sm text-red-600">{statusError}</p>
      ) : null}
    </FeaturePage>
  );
}
