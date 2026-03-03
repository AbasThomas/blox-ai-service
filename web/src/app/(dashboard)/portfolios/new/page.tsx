'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Persona } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { AuthGuard } from '@/components/shared/auth-guard';
import { integrationsApi, onboardingApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import { Check, Zap, Bot, User, ArrowUpRight, Shield, Plus, Sparkles } from '@/components/ui/icons';

type Step = 0 | 1 | 2 | 3 | 4;
type BuilderStage = 'projects' | 'certifications' | 'optimize';
type SetupMethod = 'social' | 'manual';
type Provider =
  | 'linkedin'
  | 'github'
  | 'upwork'
  | 'fiverr'
  | 'behance'
  | 'dribbble'
  | 'figma'
  | 'coursera'
  | 'udemy';

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

interface ConnectResponse {
  authUrl?: string | null;
  connected?: boolean;
  message?: string;
}

interface LatestUnfinishedImport {
  runId: string;
  status: ImportStatus['status'];
  progressPct: number;
  message?: string | null;
  draftAssetId?: string | null;
  persona?: string;
  personalSiteUrl?: string | null;
}

interface ManualProjectEntry {
  id: string;
  title: string;
  description: string;
  tools: string;
  link: string;
  imageUrl: string;
  caseStudy: string;
}

interface ManualCertificationEntry {
  id: string;
  title: string;
  issuer: string;
  date: string;
  imageUrl: string;
}

interface LocalPortfolioDraft {
  savedAt: string;
  step: 0 | 1;
  builderStage: BuilderStage;
  persona: Persona | `${Persona}`;
  profileSetupMethod: SetupMethod;
  projectSetupMethod: SetupMethod;
  certificationSetupMethod: SetupMethod;
  personalSiteUrl: string;
  locationHint: string;
  manualFullName: string;
  manualProfessionalTitle: string;
  manualBio: string;
  manualSkills: string;
  manualContactEmail: string;
  manualProfileImageUrl: string;
  manualProjects: ManualProjectEntry[];
  manualCertifications: ManualCertificationEntry[];
}

const PERSONA_OPTIONS = [
  { value: Persona.FREELANCER, label: 'Freelancer', desc: 'Service and client-result focused story' },
  { value: Persona.JOB_SEEKER, label: 'Job Seeker', desc: 'Recruiter-friendly narrative and outcomes' },
  { value: Persona.DESIGNER, label: 'Designer', desc: 'Visual case studies and portfolio-first layout' },
  { value: Persona.DEVELOPER, label: 'Developer', desc: 'Projects, architecture, and technical depth' },
  { value: Persona.STUDENT, label: 'Student', desc: 'Learning journey, internships, and potential' },
  { value: Persona.EXECUTIVE, label: 'Executive', desc: 'Leadership impact and strategic wins' },
] as const;

const FLOW_STEPS = [
  { id: 1, title: 'Choose Setup', subtitle: 'Social Import or Manual Setup' },
  { id: 2, title: 'Projects', subtitle: 'Import or upload projects' },
  { id: 3, title: 'Certifications', subtitle: 'Badges and certificates' },
  { id: 4, title: 'AI Optimization', subtitle: 'Enhance + preview before build' },
] as const;

const PROFILE_PROVIDER_IDS: Provider[] = ['linkedin', 'upwork', 'fiverr'];
const PROJECT_PROVIDER_IDS: Provider[] = ['behance', 'dribbble', 'figma'];
const CERT_PROVIDER_IDS: Provider[] = ['udemy', 'coursera'];

const DEFAULT_PROVIDER_ORDER: Provider[] = [
  'linkedin',
  'github',
  'upwork',
  'fiverr',
  'behance',
  'dribbble',
  'figma',
  'coursera',
  'udemy',
];

const PROVIDER_META: Record<Provider, { label: string; logoUrl: string }> = {
  linkedin: { label: 'LinkedIn', logoUrl: 'https://cdn.simpleicons.org/linkedin/0A66C2' },
  github: { label: 'GitHub', logoUrl: 'https://cdn.simpleicons.org/github/FFFFFF' },
  upwork: { label: 'Upwork', logoUrl: 'https://cdn.simpleicons.org/upwork/6FDA44' },
  fiverr: { label: 'Fiverr', logoUrl: 'https://cdn.simpleicons.org/fiverr/1DBF73' },
  behance: { label: 'Behance', logoUrl: 'https://cdn.simpleicons.org/behance/1769FF' },
  dribbble: { label: 'Dribbble', logoUrl: 'https://cdn.simpleicons.org/dribbble/EA4C89' },
  figma: { label: 'Figma', logoUrl: 'https://cdn.simpleicons.org/figma/F24E1E' },
  coursera: { label: 'Coursera', logoUrl: 'https://cdn.simpleicons.org/coursera/0056D2' },
  udemy: { label: 'Udemy', logoUrl: 'https://cdn.simpleicons.org/udemy/A435F0' },
};

const DEFAULT_MANUAL_PROJECT = (): ManualProjectEntry => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  tools: '',
  link: '',
  imageUrl: '',
  caseStudy: '',
});

const DEFAULT_MANUAL_CERTIFICATION = (): ManualCertificationEntry => ({
  id: crypto.randomUUID(),
  title: '',
  issuer: '',
  date: '',
  imageUrl: '',
});

const AUTH_ERROR_PATTERN = /(401|403|unauthorized|forbidden|expired token|jwt)/i;
const PORTFOLIO_DRAFT_STORAGE_PREFIX = 'blox_portfolio_new_draft';
const PORTFOLIO_IGNORED_RUNS_STORAGE_PREFIX = 'blox_portfolio_ignored_runs';

function portfolioDraftKey(userId: string) {
  return `${PORTFOLIO_DRAFT_STORAGE_PREFIX}:${userId}`;
}

function portfolioIgnoredRunsKey(userId: string) {
  return `${PORTFOLIO_IGNORED_RUNS_STORAGE_PREFIX}:${userId}`;
}

function readIgnoredRunIds(userId: string): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(portfolioIgnoredRunsKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
}

function writeIgnoredRunIds(userId: string, runIds: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(portfolioIgnoredRunsKey(userId), JSON.stringify(Array.from(new Set(runIds))));
}

function sortByPriority(items: IntegrationItem[]) {
  const rank = { primary: 0, secondary: 1, optional: 2 };
  return [...items].sort((a, b) => rank[a.priority] - rank[b.priority]);
}

function connectedProviders(items: IntegrationItem[]) {
  return items.filter((item) => item.connected).map((item) => item.id);
}

function providerLabel(provider: string) {
  if (provider in PROVIDER_META) return PROVIDER_META[provider as Provider].label;
  return provider;
}

function toSkillList(input: string) {
  return input
    .split(/[\n,]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function aiRewrite(input: string, persona: Persona | `${Persona}`) {
  const text = input.trim();
  if (!text) return input;

  const normalized = text
    .replace(/\s+/g, ' ')
    .replace(/\bi\b/g, 'I')
    .replace(/\bjavascript\b/gi, 'JavaScript')
    .replace(/\btypescript\b/gi, 'TypeScript')
    .replace(/\breact\b/gi, 'React')
    .replace(/\bnode\b/gi, 'Node.js');

  if (persona === Persona.DEVELOPER) {
    return `${normalized} I design and ship reliable software with measurable product impact.`;
  }
  if (persona === Persona.DESIGNER) {
    return `${normalized} I combine user-centered design with business outcomes to create high-converting experiences.`;
  }
  return `${normalized} I focus on clarity, ownership, and measurable outcomes.`;
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function PortfolioNewPage() {
  const router = useRouter();
  const user = useBloxStore((state) => state.user);
  const isAuthenticated = useBloxStore((state) => state.isAuthenticated);
  const accessToken = useBloxStore((state) => state.accessToken);
  const [step, setStep] = useState<Step>(0);
  const [builderStage, setBuilderStage] = useState<BuilderStage>('projects');
  const [persona, setPersona] = useState<Persona | `${Persona}`>(
    (user.persona as Persona | `${Persona}`) ?? Persona.JOB_SEEKER,
  );
  const [profileSetupMethod, setProfileSetupMethod] = useState<SetupMethod>('social');
  const [projectSetupMethod, setProjectSetupMethod] = useState<SetupMethod>('social');
  const [certificationSetupMethod, setCertificationSetupMethod] = useState<SetupMethod>('social');
  const [personalSiteUrl, setPersonalSiteUrl] = useState('');
  const [locationHint, setLocationHint] = useState('');
  const [manualFullName, setManualFullName] = useState('');
  const [manualProfessionalTitle, setManualProfessionalTitle] = useState('');
  const [manualBio, setManualBio] = useState('');
  const [manualContactEmail, setManualContactEmail] = useState('');
  const [manualProfileImageUrl, setManualProfileImageUrl] = useState('');
  const [manualProjects, setManualProjects] = useState<ManualProjectEntry[]>([
    DEFAULT_MANUAL_PROJECT(),
  ]);
  const [manualCertifications, setManualCertifications] = useState<ManualCertificationEntry[]>([
    DEFAULT_MANUAL_CERTIFICATION(),
  ]);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<Provider | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState<Provider | null>(null);
  const [runId, setRunId] = useState('');
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [startingImport, setStartingImport] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [conflicts, setConflicts] = useState<ImportConflict[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [manualSkills, setManualSkills] = useState('');
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [deletingDraft, setDeletingDraft] = useState(false);

  const selectedProviders = useMemo(
    () => connectedProviders(integrations).filter((provider) => DEFAULT_PROVIDER_ORDER.includes(provider)),
    [integrations],
  );
  const manualSkillList = useMemo(() => toSkillList(manualSkills), [manualSkills]);
  const normalizedManualProjects = useMemo(
    () =>
      manualProjects
        .map((item) => ({
          ...item,
          title: item.title.trim(),
          description: item.description.trim(),
          tools: item.tools.trim(),
          link: item.link.trim(),
          imageUrl: item.imageUrl.trim(),
          caseStudy: item.caseStudy.trim(),
        }))
        .filter((item) => item.title.length > 0),
    [manualProjects],
  );
  const normalizedManualCertifications = useMemo(
    () =>
      manualCertifications
        .map((item) => ({
          ...item,
          title: item.title.trim(),
          issuer: item.issuer.trim(),
          date: item.date.trim(),
          imageUrl: item.imageUrl.trim(),
        }))
        .filter((item) => item.title.length > 0),
    [manualCertifications],
  );
  const manualFallback = useMemo(() => {
    const next: Record<string, unknown> = {};

    const hasManualProfile =
      profileSetupMethod === 'manual' &&
      (manualFullName.trim() ||
        manualProfessionalTitle.trim() ||
        manualBio.trim() ||
        manualSkills.trim() ||
        manualContactEmail.trim() ||
        manualProfileImageUrl.trim());

    if (hasManualProfile) {
      const payload = {
        name: manualFullName.trim(),
        headline: manualProfessionalTitle.trim(),
        summary: manualBio.trim(),
        skills: manualSkillList,
        profileImageUrl: manualProfileImageUrl.trim(),
        publicUrl: personalSiteUrl.trim(),
        links: manualContactEmail.trim()
          ? { email: `mailto:${manualContactEmail.trim()}` }
          : {},
      };
      PROFILE_PROVIDER_IDS.forEach((provider) => {
        next[provider] = payload;
      });
    }

    if (projectSetupMethod === 'manual' && normalizedManualProjects.length > 0) {
      const payload = {
        projects: normalizedManualProjects.map((item) => ({
          name: item.title,
          description: item.description,
          url: item.link,
          imageUrl: item.imageUrl,
          tags: toSkillList(item.tools),
          caseStudy: item.caseStudy,
        })),
      };
      PROJECT_PROVIDER_IDS.forEach((provider) => {
        next[provider] = payload;
      });
    }

    if (certificationSetupMethod === 'manual' && normalizedManualCertifications.length > 0) {
      const payload = {
        certifications: normalizedManualCertifications.map((item) => ({
          title: item.title,
          issuer: item.issuer,
          date: item.date,
          imageUrl: item.imageUrl,
        })),
      };
      CERT_PROVIDER_IDS.forEach((provider) => {
        next[provider] = payload;
      });
    }

    return next;
  }, [
    certificationSetupMethod,
    manualBio,
    manualContactEmail,
    manualFullName,
    manualProfessionalTitle,
    manualProfileImageUrl,
    manualSkillList,
    manualSkills,
    normalizedManualCertifications,
    normalizedManualProjects,
    personalSiteUrl,
    profileSetupMethod,
    projectSetupMethod,
  ]);
  const fallbackProviders = useMemo(
    () =>
      Object.keys(manualFallback).filter((provider) =>
        DEFAULT_PROVIDER_ORDER.includes(provider as Provider),
      ) as Provider[],
    [manualFallback],
  );
  const importProviders = useMemo(() => {
    const socialProviders = selectedProviders.filter((provider) => {
      if (PROFILE_PROVIDER_IDS.includes(provider)) return profileSetupMethod === 'social';
      if (PROJECT_PROVIDER_IDS.includes(provider)) return projectSetupMethod === 'social';
      if (CERT_PROVIDER_IDS.includes(provider)) return certificationSetupMethod === 'social';
      return false;
    });

    return Array.from(new Set([...socialProviders, ...fallbackProviders]));
  }, [
    certificationSetupMethod,
    fallbackProviders,
    profileSetupMethod,
    projectSetupMethod,
    selectedProviders,
  ]);
  const clearLocalDraft = useCallback(() => {
    if (typeof window === 'undefined' || !user.id) return;
    localStorage.removeItem(portfolioDraftKey(user.id));
  }, [user.id]);

  const ignoreRunId = useCallback((id: string) => {
    if (!id || !user.id) return;
    const existing = readIgnoredRunIds(user.id);
    writeIgnoredRunIds(user.id, [...existing, id]);
  }, [user.id]);

  const hasDraftProgress = useMemo(() => {
    if (status?.status === 'completed') return false;

    return Boolean(
      runId ||
      step > 0 ||
      builderStage ||
      manualFullName.trim() ||
      manualProfessionalTitle.trim() ||
      manualBio.trim() ||
      personalSiteUrl.trim() ||
      locationHint.trim() ||
      manualSkills.trim() ||
      manualContactEmail.trim() ||
      manualProfileImageUrl.trim() ||
      normalizedManualProjects.length > 0 ||
      normalizedManualCertifications.length > 0,
    );
  }, [
    builderStage,
    locationHint,
    manualBio,
    manualContactEmail,
    manualFullName,
    manualProfessionalTitle,
    manualProfileImageUrl,
    manualSkills,
    normalizedManualCertifications.length,
    normalizedManualProjects.length,
    personalSiteUrl,
    runId,
    status?.status,
    step,
  ]);

  const resetDraftState = useCallback(() => {
    setRunId('');
    setStatus(null);
    setConflicts([]);
    setOverrides({});
    setIntegrations([]);
    setStep(0);
    setBuilderStage('projects');
    setStatusError('');
    setPersona((user.persona as Persona | `${Persona}`) ?? Persona.JOB_SEEKER);
    setProfileSetupMethod('social');
    setProjectSetupMethod('social');
    setCertificationSetupMethod('social');
    setPersonalSiteUrl('');
    setLocationHint('');
    setManualFullName('');
    setManualProfessionalTitle('');
    setManualBio('');
    setManualContactEmail('');
    setManualProfileImageUrl('');
    setManualProjects([DEFAULT_MANUAL_PROJECT()]);
    setManualCertifications([DEFAULT_MANUAL_CERTIFICATION()]);
    setManualSkills('');
  }, [user.persona]);

  const handleCancel = useCallback(() => {
    router.push('/portfolios');
  }, [router]);

  const handleDeleteDraft = useCallback(async () => {
    if (!hasDraftProgress || deletingDraft) return;

    setDeletingDraft(true);
    try {
      if (runId) {
        ignoreRunId(runId);
      }
      clearLocalDraft();
      resetDraftState();
      setStatusNote('Draft deleted.');
    } finally {
      setDeletingDraft(false);
    }
  }, [clearLocalDraft, deletingDraft, hasDraftProgress, ignoreRunId, resetDraftState, runId]);

  const requireSession = useCallback(
    (reason: string) => {
      if (isAuthenticated && accessToken) return true;
      setStatusError(`Your session expired. Please sign in again to ${reason}.`);
      router.replace('/login');
      return false;
    },
    [accessToken, isAuthenticated, router],
  );

  const handleApiError = useCallback(
    (error: unknown, fallback: string) => {
      const message = error instanceof Error ? error.message : fallback;
      if (AUTH_ERROR_PATTERN.test(message)) {
        setStatusError('Your session expired. Please sign in again.');
        router.replace('/login');
        return;
      }
      setStatusError(message);
    },
    [router],
  );

  useEffect(() => {
    if (!isAuthenticated || !accessToken || draftHydrated) return;
    let cancelled = false;

    const hydrateDraft = async () => {
      try {
        const latest = (await onboardingApi.getLatestImport()) as LatestUnfinishedImport | null;
        if (cancelled) return;
        if (latest?.runId) {
          const ignoredRunIds = user.id ? readIgnoredRunIds(user.id) : [];
          if (ignoredRunIds.includes(latest.runId)) {
            // user explicitly discarded this unfinished run
          } else {
          if (latest.persona) {
            setPersona(latest.persona as Persona | `${Persona}`);
          }
          if (latest.personalSiteUrl) {
            setPersonalSiteUrl(latest.personalSiteUrl);
          }

          setRunId(latest.runId);
          setStatus({
            runId: latest.runId,
            status: latest.status,
            progressPct: latest.progressPct,
            message: latest.message ?? undefined,
            draftAssetId: latest.draftAssetId ?? undefined,
          });

          if (latest.status === 'awaiting_review' || latest.status === 'partial') {
            try {
              const previewRes = (await onboardingApi.getImportPreview(latest.runId)) as {
                preview?: Record<string, unknown>;
              };
              if (cancelled) return;
              const preview = (previewRes.preview ?? null) as { conflicts?: ImportConflict[] } | null;
              setConflicts(Array.isArray(preview?.conflicts) ? preview.conflicts : []);
              setStep(3);
            } catch {
              setStep(2);
            }
          } else {
            setStep(2);
          }

          setStatusNote('Recovered your unfinished portfolio draft.');
          setDraftHydrated(true);
          return;
        }
        }
      } catch {
        // fall back to local draft restore
      }

      if (typeof window !== 'undefined' && user.id) {
        try {
          const rawDraft = localStorage.getItem(portfolioDraftKey(user.id));
          if (rawDraft) {
            const parsed = JSON.parse(rawDraft) as LocalPortfolioDraft;
            setPersona(parsed.persona);
            setBuilderStage(parsed.builderStage ?? 'projects');
            setProfileSetupMethod(parsed.profileSetupMethod ?? 'social');
            setProjectSetupMethod(parsed.projectSetupMethod ?? 'social');
            setCertificationSetupMethod(parsed.certificationSetupMethod ?? 'social');
            setPersonalSiteUrl(parsed.personalSiteUrl ?? '');
            setLocationHint(parsed.locationHint ?? '');
            setManualFullName(parsed.manualFullName ?? '');
            setManualProfessionalTitle(parsed.manualProfessionalTitle ?? '');
            setManualBio(parsed.manualBio ?? '');
            setManualContactEmail(parsed.manualContactEmail ?? '');
            setManualProfileImageUrl(parsed.manualProfileImageUrl ?? '');
            setManualProjects(
              Array.isArray(parsed.manualProjects) && parsed.manualProjects.length > 0
                ? parsed.manualProjects
                : [DEFAULT_MANUAL_PROJECT()],
            );
            setManualCertifications(
              Array.isArray(parsed.manualCertifications) && parsed.manualCertifications.length > 0
                ? parsed.manualCertifications
                : [DEFAULT_MANUAL_CERTIFICATION()],
            );
            setManualSkills(parsed.manualSkills ?? '');
            setStep(parsed.step === 1 ? 1 : 0);
            setStatusNote('Recovered your saved local draft.');
          }
        } catch {
          // ignore malformed local draft
        }
      }

      setDraftHydrated(true);
    };

    void hydrateDraft();

    return () => {
      cancelled = true;
    };
  }, [accessToken, draftHydrated, isAuthenticated, user.id]);

  useEffect(() => {
    if (!draftHydrated || !isAuthenticated || !accessToken || !user.id) return;
    if (runId || step > 1) return;

    const snapshot: LocalPortfolioDraft = {
      savedAt: new Date().toISOString(),
      step: step === 1 ? 1 : 0,
      builderStage,
      persona,
      profileSetupMethod,
      projectSetupMethod,
      certificationSetupMethod,
      personalSiteUrl,
      locationHint,
      manualFullName,
      manualProfessionalTitle,
      manualBio,
      manualSkills,
      manualContactEmail,
      manualProfileImageUrl,
      manualProjects,
      manualCertifications,
    };

    try {
      localStorage.setItem(portfolioDraftKey(user.id), JSON.stringify(snapshot));
    } catch {
      // ignore storage write failure
    }
  }, [
    accessToken,
    builderStage,
    certificationSetupMethod,
    draftHydrated,
    isAuthenticated,
    locationHint,
    manualBio,
    manualCertifications,
    manualContactEmail,
    manualFullName,
    manualProfessionalTitle,
    manualProfileImageUrl,
    manualProjects,
    manualSkills,
    persona,
    personalSiteUrl,
    profileSetupMethod,
    projectSetupMethod,
    runId,
    step,
    user.id,
  ]);

  const loadIntegrations = useCallback(async () => {
    if (!requireSession('load accounts')) return;
    setLoadingIntegrations(true);
    setStatusError('');
    try {
      const rows = (await integrationsApi.list()) as IntegrationItem[];
      setIntegrations(sortByPriority(rows));
    } catch (error) {
      handleApiError(error, 'Failed to load connected accounts.');
    } finally {
      setLoadingIntegrations(false);
    }
  }, [handleApiError, requireSession]);

  useEffect(() => {
    if (step === 0 || step === 1) {
      void loadIntegrations();
    }
  }, [step, loadIntegrations]);

  useEffect(() => {
    if (!runId || (step !== 2 && step !== 3)) return;
    let stopped = false;

    const pollStatus = async () => {
      try {
        if (!requireSession('continue AI draft generation')) return;
        const next = (await onboardingApi.getImportStatus(runId)) as ImportStatus;
        if (stopped) return;
        setStatus(next);

        if (next.status === 'failed') {
          setStatusError(next.message ?? 'AI draft generation failed. Reconnect accounts and retry.');
          return;
        }

        if (next.status === 'awaiting_review' || next.status === 'partial') {
          const previewRes = (await onboardingApi.getImportPreview(runId)) as {
            preview?: Record<string, unknown>;
          };
          const nextPreview = (previewRes.preview ?? null) as { conflicts?: ImportConflict[] } | null;
          setConflicts(Array.isArray(nextPreview?.conflicts) ? nextPreview.conflicts : []);
          if (step !== 3) setStep(3);
          return;
        }

        if (next.status === 'completed') {
          setStep(4);
        }
      } catch (error) {
        if (stopped) return;
        handleApiError(error, 'Unable to reach AI import service.');
      }
    };

    void pollStatus();
    const timer = setInterval(() => {
      void pollStatus();
    }, 3000);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [handleApiError, requireSession, runId, step]);

  const handleConnect = async (provider: Provider) => {
    if (!requireSession('connect an account')) return;
    setConnectingProvider(provider);
    setStatusError('');
    setStatusNote('');
    try {
      const res = (await integrationsApi.connect(provider)) as ConnectResponse;
      if (res.authUrl) {
        const token = localStorage.getItem('blox_access_token') ?? '';
        if (!token) {
          setStatusError('Missing access token. Please sign in again.');
          router.replace('/login');
          return;
        }
        const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || window.location.origin;
        const authUrl = new URL(res.authUrl, baseUrl);
        authUrl.searchParams.set('token', token);
        window.location.href = authUrl.toString();
        return;
      }

      if (res.connected) {
        setIntegrations((prev) =>
          prev.map((item) => (item.id === provider ? { ...item, connected: true } : item)),
        );
      }
      if (res.message) {
        setStatusNote(res.message);
      }
    } catch (error) {
      handleApiError(error, 'Failed to connect provider.');
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (provider: Provider) => {
    if (!requireSession('disconnect an account')) return;
    setDisconnectingProvider(provider);
    setStatusError('');
    setStatusNote('');
    try {
      await integrationsApi.disconnect(provider);
      setIntegrations((prev) =>
        prev.map((item) => (item.id === provider ? { ...item, connected: false } : item)),
      );
      setStatusNote(`${providerLabel(provider)} disconnected.`);
    } catch (error) {
      handleApiError(error, 'Failed to disconnect provider.');
    } finally {
      setDisconnectingProvider(null);
    }
  };

  const startImport = async () => {
    if (!requireSession('start AI draft generation')) return;
    setStatusError('');
    setStatusNote('');
    if (importProviders.length === 0) {
      setStatusError('Connect at least one account or provide manual profile details before starting AI.');
      return;
    }

    setStartingImport(true);
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
      setStatusNote('AI draft started. We are processing your connected sources.');
      clearLocalDraft();
      setStep(2);
    } catch (error) {
      handleApiError(error, 'Failed to start import.');
    } finally {
      setStartingImport(false);
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
    if (!requireSession('confirm your draft')) return;
    setConfirming(true);
    setStatusError('');
    try {
      const res = (await onboardingApi.confirmImport(runId, {
        overrides,
        acceptAutoMerge: true,
      })) as { draftAssetId?: string | null };

      setStep(4);
      clearLocalDraft();
      const assetId = res.draftAssetId ?? status?.draftAssetId;
      if (assetId) {
        router.push(`/portfolios/${assetId}/edit`);
      }
    } catch (error) {
      handleApiError(error, 'Failed to finalize import.');
    } finally {
      setConfirming(false);
    }
  };

  const handleProfileImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setManualProfileImageUrl(dataUrl);
    } catch {
      setStatusError('Failed to read profile image file.');
    }
  };

  const updateManualProject = (id: string, patch: Partial<ManualProjectEntry>) => {
    setManualProjects((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeManualProject = (id: string) => {
    setManualProjects((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next.length > 0 ? next : [DEFAULT_MANUAL_PROJECT()];
    });
  };

  const handleProjectImageUpload = async (id: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateManualProject(id, { imageUrl: dataUrl });
    } catch {
      setStatusError('Failed to read project image file.');
    }
  };

  const updateManualCertification = (
    id: string,
    patch: Partial<ManualCertificationEntry>,
  ) => {
    setManualCertifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const removeManualCertification = (id: string) => {
    setManualCertifications((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next.length > 0 ? next : [DEFAULT_MANUAL_CERTIFICATION()];
    });
  };

  const handleCertificationImageUpload = async (
    id: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateManualCertification(id, { imageUrl: dataUrl });
    } catch {
      setStatusError('Failed to read certificate image file.');
    }
  };

  const renderProviderCards = (providers: Provider[]) => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {providers.map((provider) => {
        const integration = integrations.find((item) => item.id === provider);
        const meta = PROVIDER_META[provider];
        if (!integration) {
          return (
            <div key={provider} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-black text-white">{meta.label}</p>
              <p className="mt-2 text-xs text-slate-500">Provider not available in current backend catalog.</p>
            </div>
          );
        }

        return (
          <div
            key={provider}
            className={`rounded-2xl border p-4 ${
              integration.connected
                ? 'border-[#1ECEFA]/35 bg-[#1ECEFA]/8'
                : 'border-white/10 bg-black/20'
            }`}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <img
                  src={meta.logoUrl}
                  alt={`${meta.label} logo`}
                  className="h-5 w-5 object-contain"
                  loading="lazy"
                />
                <div>
                  <p className="text-sm font-black text-white">{meta.label}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">{integration.category}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                  integration.connected
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {integration.connected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            {integration.connected ? (
              <button
                type="button"
                onClick={() => handleDisconnect(provider)}
                disabled={disconnectingProvider === provider}
                className="w-full rounded-xl border border-red-500/30 bg-red-500/10 py-2 text-[10px] font-black uppercase tracking-widest text-red-300 disabled:opacity-50"
              >
                {disconnectingProvider === provider ? 'Disconnecting...' : 'Disconnect'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleConnect(provider)}
                disabled={connectingProvider === provider}
                className="w-full rounded-xl bg-white py-2 text-[10px] font-black uppercase tracking-widest text-black disabled:opacity-50"
              >
                {connectingProvider === provider ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  const aiFailed = status?.status === 'failed';
  const activeFlowStage = useMemo(() => {
    if (step === 0) return 1;
    if (step === 1) {
      if (builderStage === 'projects') return 2;
      if (builderStage === 'certifications') return 3;
      return 4;
    }
    return 4;
  }, [builderStage, step]);
  const flowProgressWidth = useMemo(() => {
    return ((activeFlowStage - 1) / (FLOW_STEPS.length - 1)) * 100;
  }, [activeFlowStage]);
  const previewProjects = useMemo(() => {
    if (projectSetupMethod === 'manual' && normalizedManualProjects.length > 0) {
      return normalizedManualProjects.slice(0, 3).map((item) => ({
        title: item.title,
        description: item.description || 'Project description will appear here.',
      }));
    }
    if (projectSetupMethod === 'social') {
      const connected = selectedProviders.filter((provider) => PROJECT_PROVIDER_IDS.includes(provider));
      return connected.slice(0, 3).map((provider) => ({
        title: `${providerLabel(provider)} import`,
        description: 'Project details will be extracted and refined by AI.',
      }));
    }
    return [];
  }, [normalizedManualProjects, projectSetupMethod, selectedProviders]);
  const previewCertifications = useMemo(() => {
    if (certificationSetupMethod === 'manual' && normalizedManualCertifications.length > 0) {
      return normalizedManualCertifications.slice(0, 3).map((item) => item.title);
    }
    if (certificationSetupMethod === 'social') {
      const connected = selectedProviders.filter((provider) => CERT_PROVIDER_IDS.includes(provider));
      return connected.slice(0, 3).map((provider) => `${providerLabel(provider)} import`);
    }
    return [];
  }, [certificationSetupMethod, normalizedManualCertifications, selectedProviders]);
  const aiSuggestedSkills = useMemo(() => {
    const existing = new Set(manualSkillList.map((item) => item.toLowerCase()));
    const defaults: Record<string, string[]> = {
      Developer: ['System Design', 'Testing', 'CI/CD', 'Performance'],
      Designer: ['Design Systems', 'User Research', 'Accessibility', 'Prototyping'],
      Freelancer: ['Client Communication', 'Project Scoping', 'Proposal Writing'],
      JobSeeker: ['Interview Readiness', 'Storytelling', 'Personal Branding'],
      Executive: ['Strategy', 'Operational Leadership', 'Cross-functional Alignment'],
      Student: ['Internship Projects', 'Collaboration', 'Problem Solving'],
    };
    const suggestions = defaults[String(persona)] ?? [];
    return suggestions.filter((item) => !existing.has(item.toLowerCase())).slice(0, 5);
  }, [manualSkillList, persona]);
  const aiHeadlineSuggestion = useMemo(() => {
    const base = manualProfessionalTitle.trim();
    if (base) return `${base} Portfolio`;
    if (persona === Persona.DEVELOPER) return 'Software Developer Portfolio';
    if (persona === Persona.DESIGNER) return 'Product Designer Portfolio';
    if (persona === Persona.EXECUTIVE) return 'Leadership Portfolio';
    return 'Professional Portfolio';
  }, [manualProfessionalTitle, persona]);
  const previewName = manualFullName.trim() || 'Your Name';
  const previewTitle = manualProfessionalTitle.trim() || aiHeadlineSuggestion;
  const previewBio = useMemo(
    () => aiRewrite(manualBio.trim() || 'Add a short professional summary for your hero section.', persona),
    [manualBio, persona],
  );

  const saveDraftNow = () => {
    if (typeof window === 'undefined' || !user.id) return;
    const snapshot: LocalPortfolioDraft = {
      savedAt: new Date().toISOString(),
      step: step === 1 ? 1 : 0,
      builderStage,
      persona,
      profileSetupMethod,
      projectSetupMethod,
      certificationSetupMethod,
      personalSiteUrl,
      locationHint,
      manualFullName,
      manualProfessionalTitle,
      manualBio,
      manualSkills,
      manualContactEmail,
      manualProfileImageUrl,
      manualProjects,
      manualCertifications,
    };
    try {
      localStorage.setItem(portfolioDraftKey(user.id), JSON.stringify(snapshot));
      setStatusNote('Draft saved. You can continue later.');
    } catch {
      setStatusError('Unable to save local draft in this browser.');
    }
  };

  const goToFlowStep = (target: 1 | 2 | 3 | 4) => {
    if (step >= 2) return;
    if (target === 1) {
      setStep(0);
      return;
    }
    setStep(1);
    if (target === 2) {
      setBuilderStage('projects');
      return;
    }
    if (target === 3) {
      setBuilderStage('certifications');
      return;
    }
    setBuilderStage('optimize');
  };

  return (
    <AuthGuard>
      <FeaturePage
        title="Create New Portfolio"
        description="Structured 4-step flow: setup profile, add projects, add certifications, and run AI optimization."
      >
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Portfolio Draft Builder</p>
              <p className="text-xs text-slate-500">Save and continue later is enabled throughout this flow.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={saveDraftNow}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-200 transition hover:border-white/30"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-300 transition hover:border-white/30"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDraft}
                disabled={!hasDraftProgress || deletingDraft}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingDraft ? 'Deleting...' : 'Delete Draft'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="relative mb-4 h-[2px] w-full bg-white/10">
              <div className="h-full bg-[#1ECEFA] transition-all duration-300" style={{ width: `${flowProgressWidth}%` }} />
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              {FLOW_STEPS.map((stage) => {
                const active = stage.id === activeFlowStage;
                const complete = stage.id < activeFlowStage;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => goToFlowStep(stage.id)}
                    disabled={step >= 2}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      active
                        ? 'border-[#1ECEFA]/50 bg-[#1ECEFA]/10'
                        : complete
                          ? 'border-emerald-500/40 bg-emerald-500/10'
                          : 'border-white/10 bg-white/[0.02]'
                    } disabled:cursor-default`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Step {stage.id}</p>
                    <p className="text-sm font-semibold text-white">{stage.title}</p>
                    <p className="text-xs text-slate-400">{stage.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {(step === 0 || step === 1) && (
            <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <div className="space-y-6">
                {step === 0 && (
                  <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1ECEFA]">Step 1</p>
                      <h2 className="text-xl font-semibold text-white">Choose Setup Method</h2>
                      <p className="text-sm text-slate-400">
                        Select Social Import or Manual Setup for profile data. You can switch methods at any time.
                      </p>
                    </div>

                    <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1">
                      <button
                        type="button"
                        onClick={() => setProfileSetupMethod('social')}
                        className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
                          profileSetupMethod === 'social' ? 'bg-[#1ECEFA] text-black' : 'text-slate-300'
                        }`}
                      >
                        Social Import
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileSetupMethod('manual')}
                        className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
                          profileSetupMethod === 'manual' ? 'bg-[#1ECEFA] text-black' : 'text-slate-300'
                        }`}
                      >
                        Manual Setup
                      </button>
                    </div>

                    {profileSetupMethod === 'social' ? (
                      <div className="space-y-4">
                        <p className="text-xs text-slate-400">
                          Connect LinkedIn, Upwork, and Fiverr to extract profile details for AI refinement.
                        </p>
                        {loadingIntegrations ? (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((item) => (
                              <div key={item} className="h-28 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
                            ))}
                          </div>
                        ) : (
                          renderProviderCards(PROFILE_PROVIDER_IDS)
                        )}
                        <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
                          <Shield className="mt-0.5 h-4 w-4 text-blue-300" />
                          <p className="text-xs text-blue-200">
                            Data is read-only and used only to generate your draft portfolio.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300">Full Name</label>
                            <input
                              value={manualFullName}
                              onChange={(event) => setManualFullName(event.target.value)}
                              placeholder="Jane Doe"
                              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-[#1ECEFA]/60"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300">Professional Title</label>
                            <input
                              value={manualProfessionalTitle}
                              onChange={(event) => setManualProfessionalTitle(event.target.value)}
                              placeholder="Product Designer"
                              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-[#1ECEFA]/60"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <label className="text-xs font-semibold text-slate-300">Bio / About</label>
                            <button
                              type="button"
                              onClick={() => setManualBio((current) => aiRewrite(current, persona))}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              AI Rewrite
                            </button>
                          </div>
                          <textarea
                            value={manualBio}
                            onChange={(event) => setManualBio(event.target.value)}
                            rows={4}
                            placeholder="Short professional summary..."
                            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-[#1ECEFA]/60"
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300">Skills (comma or new line)</label>
                            <textarea
                              value={manualSkills}
                              onChange={(event) => setManualSkills(event.target.value)}
                              rows={3}
                              placeholder="React, TypeScript, UX Research"
                              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-[#1ECEFA]/60"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300">Contact Email</label>
                            <input
                              type="email"
                              value={manualContactEmail}
                              onChange={(event) => setManualContactEmail(event.target.value)}
                              placeholder="you@example.com"
                              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-[#1ECEFA]/60"
                            />
                            <label className="mt-2 block text-xs font-semibold text-slate-300">Profile Picture</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProfileImageUpload}
                              className="w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-100"
                            />
                          </div>
                        </div>
                        {manualProfileImageUrl && (
                          <img
                            src={manualProfileImageUrl}
                            alt="Profile preview"
                            className="h-24 w-24 rounded-xl border border-white/10 object-cover"
                          />
                        )}
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300">Personal Site URL (optional)</label>
                        <input
                          value={personalSiteUrl}
                          onChange={(event) => setPersonalSiteUrl(event.target.value)}
                          placeholder="https://yourportfolio.com"
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-[#1ECEFA]/60"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300">Location Hint (optional)</label>
                        <input
                          value={locationHint}
                          onChange={(event) => setLocationHint(event.target.value)}
                          placeholder="San Francisco, CA"
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-[#1ECEFA]/60"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={saveDraftNow}
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
                      >
                        Save & Continue Later
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setBuilderStage('projects');
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#1ECEFA] px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-black"
                      >
                        Continue to Projects
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {step === 1 && builderStage === 'projects' && (
                  <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1ECEFA]">Step 2</p>
                      <h2 className="text-xl font-semibold text-white">Project Import or Upload</h2>
                      <p className="text-sm text-slate-400">
                        Connect project platforms or manually add case studies and project assets.
                      </p>
                    </div>

                    <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1">
                      <button
                        type="button"
                        onClick={() => setProjectSetupMethod('social')}
                        className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
                          projectSetupMethod === 'social' ? 'bg-[#1ECEFA] text-black' : 'text-slate-300'
                        }`}
                      >
                        Social Import
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjectSetupMethod('manual')}
                        className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
                          projectSetupMethod === 'manual' ? 'bg-[#1ECEFA] text-black' : 'text-slate-300'
                        }`}
                      >
                        Manual Upload
                      </button>
                    </div>

                    {projectSetupMethod === 'social' ? (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400">Connect Behance, Dribbble, and Figma for project extraction.</p>
                        {loadingIntegrations ? (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((item) => (
                              <div key={item} className="h-28 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
                            ))}
                          </div>
                        ) : (
                          renderProviderCards(PROJECT_PROVIDER_IDS)
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {manualProjects.map((project, index) => (
                          <div key={project.id} className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Project {index + 1}</p>
                              <button
                                type="button"
                                onClick={() => removeManualProject(project.id)}
                                className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-red-300"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <input
                                value={project.title}
                                onChange={(event) => updateManualProject(project.id, { title: event.target.value })}
                                placeholder="Project title"
                                className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-[#1ECEFA]/60"
                              />
                              <input
                                value={project.tools}
                                onChange={(event) => updateManualProject(project.id, { tools: event.target.value })}
                                placeholder="Tools used"
                                className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-[#1ECEFA]/60"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <label className="text-xs font-semibold text-slate-300">Description</label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateManualProject(project.id, {
                                      description: aiRewrite(project.description, persona),
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  AI Rewrite
                                </button>
                              </div>
                              <textarea
                                value={project.description}
                                onChange={(event) =>
                                  updateManualProject(project.id, { description: event.target.value })
                                }
                                rows={3}
                                placeholder="Describe the problem, your approach, and outcomes."
                                className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-[#1ECEFA]/60"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <label className="text-xs font-semibold text-slate-300">Case Study</label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateManualProject(project.id, { caseStudy: aiRewrite(project.caseStudy, persona) })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  AI Rewrite
                                </button>
                              </div>
                              <textarea
                                value={project.caseStudy}
                                onChange={(event) => updateManualProject(project.id, { caseStudy: event.target.value })}
                                rows={3}
                                placeholder="Add your case-study narrative."
                                className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-[#1ECEFA]/60"
                              />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <input
                                value={project.link}
                                onChange={(event) => updateManualProject(project.id, { link: event.target.value })}
                                placeholder="Project link"
                                className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-[#1ECEFA]/60"
                              />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => void handleProjectImageUpload(project.id, event)}
                                className="w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-100"
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setManualProjects((prev) => [...prev, DEFAULT_MANUAL_PROJECT()])}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
                        >
                          <Plus className="h-4 w-4" />
                          Add Project
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(0)}
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuilderStage('certifications')}
                        className="rounded-xl bg-[#1ECEFA] px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-black"
                      >
                        Continue to Certifications
                      </button>
                    </div>
                  </div>
                )}

                {step === 1 && builderStage === 'certifications' && (
                  <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1ECEFA]">Step 3</p>
                      <h2 className="text-xl font-semibold text-white">Badges & Certifications</h2>
                      <p className="text-sm text-slate-400">
                        Connect Udemy/Coursera or add certificates manually.
                      </p>
                    </div>

                    <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1">
                      <button
                        type="button"
                        onClick={() => setCertificationSetupMethod('social')}
                        className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
                          certificationSetupMethod === 'social' ? 'bg-[#1ECEFA] text-black' : 'text-slate-300'
                        }`}
                      >
                        Social Import
                      </button>
                      <button
                        type="button"
                        onClick={() => setCertificationSetupMethod('manual')}
                        className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
                          certificationSetupMethod === 'manual' ? 'bg-[#1ECEFA] text-black' : 'text-slate-300'
                        }`}
                      >
                        Manual Upload
                      </button>
                    </div>

                    {certificationSetupMethod === 'social' ? (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400">Connect Udemy and Coursera to import certificates.</p>
                        {loadingIntegrations ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {[1, 2].map((item) => (
                              <div key={item} className="h-28 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
                            ))}
                          </div>
                        ) : (
                          renderProviderCards(CERT_PROVIDER_IDS)
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {manualCertifications.map((certification, index) => (
                          <div key={certification.id} className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                                Certificate {index + 1}
                              </p>
                              <button
                                type="button"
                                onClick={() => removeManualCertification(certification.id)}
                                className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-red-300"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <input
                                value={certification.title}
                                onChange={(event) =>
                                  updateManualCertification(certification.id, { title: event.target.value })
                                }
                                placeholder="Certificate title"
                                className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-[#1ECEFA]/60"
                              />
                              <input
                                value={certification.issuer}
                                onChange={(event) =>
                                  updateManualCertification(certification.id, { issuer: event.target.value })
                                }
                                placeholder="Issuer"
                                className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-[#1ECEFA]/60"
                              />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <input
                                value={certification.date}
                                onChange={(event) =>
                                  updateManualCertification(certification.id, { date: event.target.value })
                                }
                                placeholder="Completion date"
                                className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-[#1ECEFA]/60"
                              />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => void handleCertificationImageUpload(certification.id, event)}
                                className="w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-100"
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setManualCertifications((prev) => [...prev, DEFAULT_MANUAL_CERTIFICATION()])
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
                        >
                          <Plus className="h-4 w-4" />
                          Add Certificate
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setBuilderStage('projects')}
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuilderStage('optimize')}
                        className="rounded-xl bg-[#1ECEFA] px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-black"
                      >
                        Continue to AI Optimization
                      </button>
                    </div>
                  </div>
                )}

                {step === 1 && builderStage === 'optimize' && (
                  <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1ECEFA]">Step 4</p>
                      <h2 className="text-xl font-semibold text-white">AI Optimization Layer</h2>
                      <p className="text-sm text-slate-400">
                        AI improves wording, removes redundancy, and aligns tone with your target role before build.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Career Persona</p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {PERSONA_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setPersona(option.value)}
                            className={`rounded-xl border p-3 text-left transition ${
                              persona === option.value
                                ? 'border-[#1ECEFA]/60 bg-[#1ECEFA]/10'
                                : 'border-white/10 bg-black/30'
                            }`}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <User className="h-4 w-4 text-slate-300" />
                              <p className="text-sm font-semibold text-white">{option.label}</p>
                            </div>
                            <p className="text-xs text-slate-400">{option.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Suggested Headline</p>
                        <button
                          type="button"
                          onClick={() => setManualProfessionalTitle(aiHeadlineSuggestion)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Use Suggestion
                        </button>
                      </div>
                      <p className="text-sm text-white">{aiHeadlineSuggestion}</p>
                    </div>

                    <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Suggested Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestedSkills.length > 0 ? (
                          aiSuggestedSkills.map((skill) => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => {
                                const next = new Set(manualSkillList);
                                next.add(skill);
                                setManualSkills(Array.from(next).join(', '));
                              }}
                              className="rounded-lg border border-[#1ECEFA]/40 bg-[#1ECEFA]/10 px-2 py-1 text-[11px] font-semibold text-[#9DEFFE]"
                            >
                              + {skill}
                            </button>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500">No additional suggestions. Your skills list looks complete.</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Data Sources Used for Build</p>
                      <div className="flex flex-wrap gap-2">
                        {importProviders.length > 0 ? (
                          importProviders.map((provider) => (
                            <span
                              key={provider}
                              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-200"
                            >
                              <img
                                src={PROVIDER_META[provider].logoUrl}
                                alt={`${PROVIDER_META[provider].label} logo`}
                                className="h-4 w-4 object-contain"
                                loading="lazy"
                              />
                              {PROVIDER_META[provider].label}
                            </span>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500">No import sources selected yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setBuilderStage('certifications')}
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
                      >
                        Back
                      </button>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={saveDraftNow}
                          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
                        >
                          Save & Continue Later
                        </button>
                        <button
                          type="button"
                          onClick={startImport}
                          disabled={startingImport}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#1ECEFA] px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-black disabled:opacity-60"
                        >
                          {startingImport ? 'Starting AI...' : 'Generate AI Draft'}
                          <Zap className="h-4 w-4 fill-current" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <aside className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Real-time Preview</p>
                <div className="space-y-4 rounded-xl border border-white/10 bg-black/25 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {manualProfileImageUrl ? (
                        <img
                          src={manualProfileImageUrl}
                          alt="Profile"
                          className="h-12 w-12 rounded-lg border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white">{previewName}</p>
                        <p className="text-xs text-slate-400">{previewTitle}</p>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-300">{previewBio}</p>
                    {(manualContactEmail || personalSiteUrl) && (
                      <p className="text-xs text-slate-400">
                        Contact: {manualContactEmail || personalSiteUrl}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {manualSkillList.length > 0 ? (
                        manualSkillList.slice(0, 10).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-200"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">Skills will appear here.</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Projects</p>
                    <div className="space-y-2">
                      {previewProjects.length > 0 ? (
                        previewProjects.map((project, index) => (
                          <div key={`${project.title}-${index}`} className="rounded-lg border border-white/10 bg-black/35 p-2">
                            <p className="text-xs font-semibold text-white">{project.title}</p>
                            <p className="mt-1 text-[11px] text-slate-400">{project.description}</p>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">Projects will appear here.</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Certifications</p>
                    <div className="space-y-1">
                      {previewCertifications.length > 0 ? (
                        previewCertifications.map((certification) => (
                          <p key={certification} className="text-xs text-slate-300">
                            {certification}
                          </p>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">Certifications will appear here.</span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Preview-before-publish is enabled. Final editing happens in the draft editor after AI generation.
                </p>
              </aside>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
              {aiFailed ? (
                <div className="space-y-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-300">
                    <Bot className="h-7 w-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">AI Draft Failed</h3>
                    <p className="mx-auto max-w-xl text-sm text-slate-400">
                      {status?.message ?? 'We could not complete this run. Reconnect providers or update manual fields and retry.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setBuilderStage('optimize');
                      }}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
                    >
                      Back to Optimization
                    </button>
                    <button
                      type="button"
                      onClick={startImport}
                      disabled={startingImport}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#1ECEFA] px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-black disabled:opacity-60"
                    >
                      {startingImport ? 'Retrying...' : 'Retry'}
                      <Zap className="h-4 w-4 fill-current" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 text-[#1ECEFA]">
                    <Bot className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Generating Portfolio Draft</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      {status?.message ?? 'Analyzing sources and preparing a polished structure.'}
                    </p>
                  </div>
                  <div className="mx-auto w-full max-w-xl space-y-2">
                    <div className="h-2 w-full rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#1ECEFA] transition-all duration-500"
                        style={{ width: `${status?.progressPct ?? 10}%` }}
                      />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {status?.progressPct ?? 10}% complete
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1ECEFA]">Review</p>
                <h3 className="text-xl font-semibold text-white">Resolve Import Conflicts</h3>
                <p className="text-sm text-slate-400">Confirm values where imported sources disagree.</p>
              </div>

              {conflicts.length === 0 ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  No conflicts found. You can finalize the draft.
                </div>
              ) : (
                <div className="space-y-4">
                  {conflicts.map((conflict) => (
                    <div key={conflict.field} className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{conflict.field}</p>
                        <span className="rounded-md border border-[#1ECEFA]/40 bg-[#1ECEFA]/10 px-2 py-1 text-[10px] font-semibold text-[#A8F3FF]">
                          Suggested: {providerLabel(conflict.recommendedProvider)}
                        </span>
                      </div>
                      <input
                        value={overrides[conflict.field] ?? ''}
                        onChange={(event) =>
                          setOverrides((prev) => ({ ...prev, [conflict.field]: event.target.value }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-[#1ECEFA]/60"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setBuilderStage('optimize');
                  }}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={confirmImport}
                  disabled={confirming}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1ECEFA] px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-black disabled:opacity-60"
                >
                  {confirming ? 'Finalizing...' : 'Finalize Draft'}
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-400/20 text-emerald-100">
                <Check className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-white">Draft Ready</h3>
                <p className="text-sm text-emerald-100/90">
                  Your portfolio draft is ready for final edits and publishing.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {status?.draftAssetId && (
                  <button
                    type="button"
                    onClick={() => router.push(`/portfolios/${status.draftAssetId}/edit`)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-black"
                  >
                    Open Editor
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => router.push('/portfolios')}
                  className="rounded-xl border border-white/20 bg-white/10 px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-white"
                >
                  Back to Portfolios
                </button>
              </div>
            </div>
          )}

          {statusError && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3">
              <p className="text-xs font-semibold text-red-300">{statusError}</p>
            </div>
          )}
          {statusNote && !statusError && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3">
              <p className="text-xs font-semibold text-emerald-200">{statusNote}</p>
            </div>
          )}
        </div>
      </FeaturePage>
    </AuthGuard>
  );
}
