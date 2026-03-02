'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Persona } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { integrationsApi, onboardingApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import { Check, Zap, Bot, User, ArrowUpRight, Shield } from '@/components/ui/icons';

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
  queueJobId?: string;
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
  const [conflicts, setConflicts] = useState<ImportConflict[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [manualLinkedinHeadline, setManualLinkedinHeadline] = useState('');
  const [manualLinkedinSummary, setManualLinkedinSummary] = useState('');
  const [manualUpworkTitle, setManualUpworkTitle] = useState('');
  const [manualUpworkOverview, setManualUpworkOverview] = useState('');
  const [manualSkills, setManualSkills] = useState('');

  const selectedProviders = useMemo(
    () => connectedProviders(integrations).filter((provider) => DEFAULT_PROVIDER_ORDER.includes(provider)),
    [integrations],
  );
  const manualSkillList = useMemo(
    () =>
      manualSkills
        .split(/[\n,]+/)
        .map((skill) => skill.trim())
        .filter(Boolean),
    [manualSkills],
  );
  const manualFallback = useMemo(() => {
    const next: Record<string, unknown> = {};
    if (manualLinkedinHeadline.trim() || manualLinkedinSummary.trim()) {
      next.linkedin = {
        headline: manualLinkedinHeadline.trim(),
        summary: manualLinkedinSummary.trim(),
      };
    }
    if (manualUpworkTitle.trim() || manualUpworkOverview.trim() || manualSkillList.length > 0) {
      next.upwork = {
        headline: manualUpworkTitle.trim(),
        summary: manualUpworkOverview.trim(),
        skills: manualSkillList,
      };
    }
    return next;
  }, [
    manualLinkedinHeadline,
    manualLinkedinSummary,
    manualSkillList,
    manualUpworkOverview,
    manualUpworkTitle,
  ]);
  const fallbackProviders = useMemo(
    () => Object.keys(manualFallback).filter((provider) => DEFAULT_PROVIDER_ORDER.includes(provider as Provider)) as Provider[],
    [manualFallback],
  );
  const importProviders = useMemo(
    () => Array.from(new Set([...selectedProviders, ...fallbackProviders])),
    [fallbackProviders, selectedProviders],
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
          const nextPreview = (previewRes.preview ?? null) as { conflicts?: ImportConflict[] } | null;
          const conflictRows = Array.isArray(nextPreview?.conflicts) ? nextPreview.conflicts : [];
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
      const res = (await integrationsApi.connect(provider)) as {
        authUrl?: string | null;
        mode?: string;
        connected?: boolean;
        message?: string;
      };
      if (res.authUrl) {
        window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333'}${res.authUrl}`;
        return;
      }

      if (res.connected) {
        setIntegrations((prev) => prev.map((item) => (item.id === provider ? { ...item, connected: true } : item)));
      }
      if (res.message) {
        setStatusError(res.message);
      }
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
    if (importProviders.length === 0) {
      setStatusError('Connect at least one provider or fill manual fallback fields before starting import.');
      return;
    }

    try {
      const res = (await onboardingApi.startImport({
        persona,
        providers: importProviders,
        personalSiteUrl: personalSiteUrl || undefined,
        locationHint: locationHint || undefined,
        manualFallback: Object.keys(manualFallback).length > 0 ? manualFallback : undefined,
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
    <FeaturePage 
      title="Build Your Portfolio" 
      description="Connect your digital identity and let AI compile your professional story in seconds."
    >
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
        {/* Modern Stepper */}
        <div className="relative flex justify-between items-center px-2">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-[#1ECEFA] -translate-y-1/2 z-0 transition-all duration-500 shadow-[0_0_10px_rgba(30,206,250,0.5)]" 
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />
          
          {STEPS.map((label, index) => (
            <div key={label} className="relative z-10 flex flex-col items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border-2 transition-all duration-300 ${
                index < step 
                  ? 'bg-green-500 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                  : index === step 
                    ? 'bg-black border-[#1ECEFA] text-[#1ECEFA] shadow-[0_0_15px_rgba(30,206,250,0.4)]' 
                    : 'bg-black border-white/10 text-slate-600'
              }`}>
                {index < step ? <Check className="h-5 w-5" /> : <span className="text-sm font-black">{index + 1}</span>}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                index === step ? 'text-[#1ECEFA]' : 'text-slate-600'
              }`}>{label}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {step === 0 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2 text-center">
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Define Your Persona</h2>
                <p className="text-sm text-slate-400">Select the narrative lens AI will use to compile your portfolio.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PERSONA_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPersona(option.value)}
                    className={`group relative flex flex-col items-start rounded-3xl border p-6 transition-all duration-300 ${
                      persona === option.value 
                        ? 'border-[#1ECEFA] bg-[#1ECEFA]/5 shadow-[inset_0_0_20px_rgba(30,206,250,0.05)]' 
                        : 'border-white/10 bg-black/40 hover:border-white/20'
                    }`}
                  >
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
                      persona === option.value ? 'bg-[#1ECEFA] border-[#1ECEFA] text-black' : 'bg-white/5 border-white/5 text-slate-500 group-hover:text-white'
                    }`}>
                      <User className="h-6 w-6" />
                    </div>
                    <h3 className={`text-sm font-black uppercase tracking-tight transition-colors ${
                      persona === option.value ? 'text-[#1ECEFA]' : 'text-white'
                    }`}>{option.label}</h3>
                    <p className="mt-2 text-xs text-slate-500 leading-relaxed">{option.desc}</p>
                    
                    {persona === option.value && (
                      <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-[#1ECEFA] shadow-[0_0_10px_rgba(30,206,250,0.8)]" />
                    )}
                  </button>
                ))}
              </div>

              <div className="grid gap-6 sm:grid-cols-2 rounded-3xl border border-white/10 bg-black/20 p-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Personal Site URL (Optional)</label>
                  <input
                    value={personalSiteUrl}
                    onChange={(e) => setPersonalSiteUrl(e.target.value)}
                    placeholder="https://yourdomain.com"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Location Base (Optional)</label>
                  <input
                    value={locationHint}
                    onChange={(e) => setLocationHint(e.target.value)}
                    placeholder="San Francisco, CA"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setStep(1)}
                  className="group flex items-center gap-3 rounded-2xl bg-white px-10 py-5 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-[#1ECEFA] hover:shadow-[0_0_30px_rgba(30,206,250,0.5)] active:scale-95"
                >
                  Continue to Integrations <ArrowUpRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2 text-center">
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Connect Your Nodes</h2>
                <p className="text-sm text-slate-400">Link your accounts to provide raw data for AI compilation.</p>
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Shield className="h-5 w-5" />
                </div>
                <p className="text-xs text-blue-400/80 leading-relaxed">We only access public profile data to build your draft. No modify permissions are requested.</p>
              </div>

              {loadingIntegrations ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="h-40 animate-pulse rounded-3xl bg-white/5 border border-white/5" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {integrations.map((integration) => (
                    <div 
                      key={integration.id} 
                      className={`group relative rounded-3xl border p-6 transition-all duration-300 ${
                        integration.connected 
                          ? 'border-[#1ECEFA]/30 bg-[#1ECEFA]/5 shadow-[inset_0_0_20px_rgba(30,206,250,0.05)]' 
                          : 'border-white/10 bg-black/40 hover:border-white/20'
                      }`}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">{integration.name}</h3>
                        {integration.connected && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-green-400 border border-green-500/20">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6">{integration.category}</p>
                      
                      {integration.connected ? (
                        <button
                          onClick={() => handleDisconnect(integration.id)}
                          className="w-full rounded-xl border border-red-500/20 bg-red-500/5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-red-400 hover:bg-red-500 hover:text-white transition-all"
                        >
                          DISCONNECT
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(integration.id)}
                          className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#1ECEFA] hover:text-black transition-all"
                        >
                          CONNECT
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-6 rounded-3xl border border-white/5 bg-black/20 p-8">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Manual Overrides</h3>
                  <p className="text-xs text-slate-500">If you prefer not to connect an account, provide manual context here.</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">LinkedIn Headline</label>
                      <input
                        value={manualLinkedinHeadline}
                        onChange={(e) => setManualLinkedinHeadline(e.target.value)}
                        placeholder="Senior Systems Engineer"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Professional Summary</label>
                      <textarea
                        value={manualLinkedinSummary}
                        onChange={(e) => setManualLinkedinSummary(e.target.value)}
                        rows={4}
                        placeholder="I specialize in architecting scalable distributed systems..."
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none transition-all resize-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Core Skills (Comma separated)</label>
                      <textarea
                        value={manualSkills}
                        onChange={(e) => setManualSkills(e.target.value)}
                        rows={2}
                        placeholder="React, TypeScript, AWS, Kubernetes"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none transition-all resize-none"
                      />
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Import Nodes</p>
                      <div className="flex flex-wrap gap-2">
                        {importProviders.length > 0 ? (
                          importProviders.map(p => (
                            <span key={p} className="rounded-lg bg-[#1ECEFA]/10 border border-[#1ECEFA]/20 px-2.5 py-1 text-[9px] font-black text-[#1ECEFA] uppercase tracking-widest">{p}</span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-700 italic">None selected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setStep(0)} 
                  className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={startImport} 
                  className="flex items-center gap-3 rounded-2xl bg-[#1ECEFA] px-10 py-5 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-white hover:shadow-[0_0_30px_rgba(30,206,250,0.5)] active:scale-95"
                >
                  Initialize AI Compilation <Zap className="h-5 w-5 fill-current" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-700 py-20">
              <div className="relative">
                <div className="h-40 w-40 rounded-full border-4 border-white/5 border-t-[#1ECEFA] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-24 w-24 rounded-full bg-[#1ECEFA]/10 border border-[#1ECEFA]/20 flex items-center justify-center animate-pulse">
                    <Bot className="h-10 w-10 text-[#1ECEFA]" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 text-center max-w-md">
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Compiling Your Story</h2>
                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                    <div 
                      className="h-full bg-[#1ECEFA] transition-all duration-1000 shadow-[0_0_15px_rgba(30,206,250,0.6)]" 
                      style={{ width: `${status?.progressPct ?? 10}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="text-slate-600">Progress</span>
                    <span className="text-[#1ECEFA]">{status?.progressPct ?? 10}%</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed italic">"{status?.message ?? 'Synthesizing professional nodes and optimizing narrative...'}"</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2 text-center">
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Review Conflicts</h2>
                <p className="text-sm text-slate-400">Multiple sources provided different values. Review and finalize.</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-8 shadow-xl">
                {conflicts.length === 0 ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                      <Check className="h-8 w-8" />
                    </div>
                    <p className="text-sm text-slate-400">No merge conflicts detected. AI has automatically optimized your data.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {conflicts.map((conflict) => (
                      <div key={conflict.field} className="group rounded-2xl border border-white/5 bg-white/2 p-6 transition-all hover:border-white/10 hover:bg-white/5">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Conflict: {conflict.field}</p>
                          <span className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2 py-1 text-[9px] font-black text-blue-400 uppercase tracking-widest">AI Recommended</span>
                        </div>
                        <div className="space-y-4">
                          <input
                            value={overrides[conflict.field] ?? ''}
                            onChange={(e) => setOverrides((prev) => ({ ...prev, [conflict.field]: e.target.value }))}
                            className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none transition-all"
                          />
                          <p className="text-[10px] text-slate-600 italic px-2">Source: {conflict.recommendedProvider}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setStep(1)} 
                  className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                >
                  Back
                </button>
                <button
                  onClick={confirmImport}
                  disabled={confirming}
                  className="flex items-center gap-3 rounded-2xl bg-white px-10 py-5 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-[#1ECEFA] hover:shadow-[0_0_30px_rgba(30,206,250,0.5)] active:scale-95 disabled:opacity-50"
                >
                  {confirming ? 'Finalizing Archive...' : 'Finalize Draft'} <Check className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in zoom-in-95 duration-700 py-20">
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center text-white shadow-[0_0_40px_rgba(34,197,94,0.6)]">
                    <Check className="h-10 w-10" strokeWidth={3} />
                  </div>
                </div>
                {/* Particles/Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-full bg-green-500/20 blur-[60px] rounded-full -z-10" />
              </div>
              
              <div className="space-y-4 max-w-md">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Compilation Successful</h2>
                <p className="text-sm text-slate-500 leading-relaxed">Your professional archive has been generated. The draft is ready for fine-tuning in the visual editor.</p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-sm">
                {status?.draftAssetId && (
                  <button
                    onClick={() => router.push(`/portfolios/${status.draftAssetId}/edit`)}
                    className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-5 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-[#1ECEFA] hover:shadow-[0_0_30px_rgba(30,206,250,0.5)] active:scale-95"
                  >
                    Open Editor <ArrowUpRight className="h-5 w-5" />
                  </button>
                )}
                <button 
                  onClick={() => router.push('/dashboard')} 
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-8 py-5 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                >
                  Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {statusError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-center animate-in shake duration-500">
            <p className="text-xs font-black uppercase tracking-widest text-red-500">{statusError}</p>
          </div>
        )}
      </div>
    </FeaturePage>
  );
}
