'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Persona } from '@nextjs-blox/shared-types';
import { FeaturePage } from '@/components/shared/feature-page';
import { AuthGuard } from '@/components/shared/auth-guard';
import {
  assetsApi,
  integrationsApi,
  onboardingApi,
  publishApi,
} from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import { Check, Zap, Bot, ArrowUpRight, Plus } from '@/components/ui/icons';

type Step = 1 | 2 | 3 | 4 | 5;
type ImportMode = 'social' | 'manual' | 'hybrid';
type ImportTab = 'profile' | 'projects' | 'certifications';
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
  category: string;
  connected: boolean;
  priority: 'primary' | 'secondary' | 'optional';
}

interface ImportStatus {
  runId: string;
  status:
    | 'queued'
    | 'running'
    | 'awaiting_review'
    | 'completed'
    | 'failed'
    | 'partial';
  progressPct: number;
  message?: string;
  draftAssetId?: string;
}

interface ImportConflict {
  field: string;
  recommendedProvider: string;
  recommendedValue: string;
}

interface ConnectResponse {
  authUrl?: string | null;
  connected?: boolean;
}

interface ManualProjectEntry {
  id: string;
  title: string;
  description: string;
  tools: string;
  caseStudy: string;
  link: string;
  imageUrl: string;
}

interface ManualCertificationEntry {
  id: string;
  title: string;
  issuer: string;
  date: string;
  imageUrl: string;
  proofUrl: string;
  proofName: string;
}

const PROFILE_PROVIDER_IDS: Provider[] = ['linkedin', 'upwork', 'fiverr'];
const PROJECT_PROVIDER_IDS: Provider[] = ['github', 'behance', 'figma'];
const CERT_PROVIDER_IDS: Provider[] = ['udemy', 'coursera'];
const AUTH_ERROR_PATTERN =
  /(401|403|unauthorized|forbidden|expired token|jwt)/i;
const PORTFOLIO_DRAFT_STORAGE_PREFIX = 'blox_portfolio_new_draft_5step';

const PERSONA_OPTIONS: Array<{ value: Persona; label: string; desc: string }> =
  [
    {
      value: Persona.FREELANCER,
      label: 'Freelancer (Developer/Designer)',
      desc: 'Conversion-first storytelling.',
    },
    {
      value: Persona.JOB_SEEKER,
      label: 'Job Seeker',
      desc: 'ATS-friendly recruiter narrative.',
    },
    {
      value: Persona.STUDENT,
      label: 'Student',
      desc: 'Potential, internships, and growth.',
    },
    {
      value: Persona.PROFESSIONAL,
      label: 'Professional',
      desc: 'Clean and credible positioning.',
    },
    {
      value: Persona.EXECUTIVE,
      label: 'Executive',
      desc: 'Strategic leadership outcomes.',
    },
  ];

const PERSONA_AI_TIPS: Record<string, string> = {
  [Persona.FREELANCER]:
    'Lead with outcomes and trust signals. Hybrid import is best for freelancers.',
  [Persona.JOB_SEEKER]:
    'Use a targeted headline and role-specific keywords for recruiter searches.',
  [Persona.STUDENT]:
    'Include class, internship, and capstone projects to raise project depth quickly.',
  [Persona.PROFESSIONAL]:
    'Balance domain expertise with measurable project impact and consistency.',
  [Persona.EXECUTIVE]:
    'Prioritize strategy, leadership outcomes, and transformation milestones.',
  default: 'Use concise outcomes, clear skills, and role-specific keywords.',
};

const PROVIDER_META: Record<Provider, { label: string; logoUrl: string }> = {
  linkedin: {
    label: 'LinkedIn',
    logoUrl: 'https://cdn.simpleicons.org/linkedin/0A66C2',
  },
  github: {
    label: 'GitHub',
    logoUrl: 'https://cdn.simpleicons.org/github/FFFFFF',
  },
  upwork: {
    label: 'Upwork',
    logoUrl: 'https://cdn.simpleicons.org/upwork/6FDA44',
  },
  fiverr: {
    label: 'Fiverr',
    logoUrl: 'https://cdn.simpleicons.org/fiverr/1DBF73',
  },
  behance: {
    label: 'Behance',
    logoUrl: 'https://cdn.simpleicons.org/behance/1769FF',
  },
  dribbble: {
    label: 'Dribbble',
    logoUrl: 'https://cdn.simpleicons.org/dribbble/EA4C89',
  },
  figma: {
    label: 'Figma',
    logoUrl: 'https://cdn.simpleicons.org/figma/F24E1E',
  },
  coursera: {
    label: 'Coursera',
    logoUrl: 'https://cdn.simpleicons.org/coursera/0056D2',
  },
  udemy: {
    label: 'Udemy',
    logoUrl: 'https://cdn.simpleicons.org/udemy/A435F0',
  },
};

const DEFAULT_MANUAL_PROJECT = (): ManualProjectEntry => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  tools: '',
  caseStudy: '',
  link: '',
  imageUrl: '',
});

const DEFAULT_MANUAL_CERTIFICATION = (): ManualCertificationEntry => ({
  id: crypto.randomUUID(),
  title: '',
  issuer: '',
  date: '',
  imageUrl: '',
  proofUrl: '',
  proofName: '',
});

function toSkillList(input: string) {
  return input
    .split(/[\n,]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () =>
      reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function modeHasSocial(mode: ImportMode) {
  return mode === 'social' || mode === 'hybrid';
}

function modeHasManual(mode: ImportMode) {
  return mode === 'manual' || mode === 'hybrid';
}

function portfolioDraftKey(userId: string) {
  return `${PORTFOLIO_DRAFT_STORAGE_PREFIX}:${userId}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function reorderById<T extends { id: string }>(
  items: T[],
  fromId: string,
  toId: string,
) {
  const fromIndex = items.findIndex((item) => item.id === fromId);
  const toIndex = items.findIndex((item) => item.id === toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export default function PortfolioNewPage() {
  const router = useRouter();
  const user = useBloxStore((state) => state.user);
  const isAuthenticated = useBloxStore((state) => state.isAuthenticated);
  const accessToken = useBloxStore((state) => state.accessToken);

  const [step, setStep] = useState<Step>(1);
  const [setupMethod, setSetupMethod] = useState<SetupMethod>('social');
  const [activeTab, setActiveTab] = useState<ImportTab>('profile');
  const [persona, setPersona] = useState<Persona | `${Persona}`>(
    (user.persona as Persona | `${Persona}`) ?? Persona.JOB_SEEKER,
  );
  const [focusQuestion, setFocusQuestion] = useState('');
  const [profileMode, setProfileMode] = useState<ImportMode>('social');
  const [projectMode, setProjectMode] = useState<ImportMode>('hybrid');
  const [certificationMode, setCertificationMode] =
    useState<ImportMode>('hybrid');
  const [certificationsEnabled, setCertificationsEnabled] = useState(true);
  const [quickFillUrl, setQuickFillUrl] = useState('');

  const [personalSiteUrl, setPersonalSiteUrl] = useState('');
  const [locationHint, setLocationHint] = useState('');
  const [manualFullName, setManualFullName] = useState('');
  const [manualProfessionalTitle, setManualProfessionalTitle] = useState('');
  const [manualBio, setManualBio] = useState('');
  const [manualSkills, setManualSkills] = useState('');
  const [manualContactEmail, setManualContactEmail] = useState('');
  const [manualProfileImageUrl, setManualProfileImageUrl] = useState('');
  const [manualProjects, setManualProjects] = useState<ManualProjectEntry[]>([
    DEFAULT_MANUAL_PROJECT(),
  ]);
  const [manualCertifications, setManualCertifications] = useState<
    ManualCertificationEntry[]
  >([DEFAULT_MANUAL_CERTIFICATION()]);
  const [draggingProjectId, setDraggingProjectId] = useState('');
  const [draggingCertificationId, setDraggingCertificationId] = useState('');

  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<Provider | null>(
    null,
  );
  const [disconnectingProvider, setDisconnectingProvider] =
    useState<Provider | null>(null);

  const [runId, setRunId] = useState('');
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [startingImport, setStartingImport] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [conflicts, setConflicts] = useState<ImportConflict[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [statusError, setStatusError] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [publishSubdomain, setPublishSubdomain] = useState('');
  const [publishCustomDomain, setPublishCustomDomain] = useState('');
  const [publishVisibility, setPublishVisibility] = useState<
    'PUBLIC' | 'PRIVATE' | 'UNLISTED'
  >('PUBLIC');
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [subdomainSuggestions, setSubdomainSuggestions] = useState<string[]>(
    [],
  );
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>(
    'desktop',
  );

  const manualSkillList = useMemo(
    () => toSkillList(manualSkills),
    [manualSkills],
  );
  const selectedProviders = useMemo(
    () => integrations.filter((item) => item.connected).map((item) => item.id),
    [integrations],
  );

  const normalizedManualProjects = useMemo(
    () =>
      manualProjects
        .map((item) => ({
          ...item,
          title: item.title.trim(),
          description: item.description.trim(),
          tools: item.tools.trim(),
          caseStudy: item.caseStudy.trim(),
          link: item.link.trim(),
          imageUrl: item.imageUrl.trim(),
        }))
        .filter((item) => item.title),
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
          proofUrl: item.proofUrl.trim(),
          proofName: item.proofName.trim(),
        }))
        .filter((item) => item.title),
    [manualCertifications],
  );

  const manualFallback = useMemo(() => {
    const next: Record<string, unknown> = {};
    if (
      modeHasManual(profileMode) &&
      (manualFullName ||
        manualProfessionalTitle ||
        manualBio ||
        manualSkills ||
        manualContactEmail ||
        manualProfileImageUrl)
    ) {
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
    if (modeHasManual(projectMode) && normalizedManualProjects.length > 0) {
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
    if (
      certificationsEnabled &&
      modeHasManual(certificationMode) &&
      normalizedManualCertifications.length > 0
    ) {
      const payload = {
        certifications: normalizedManualCertifications.map((item) => ({
          title: item.title,
          issuer: item.issuer,
          date: item.date,
          imageUrl: item.imageUrl,
          proofUrl: item.proofUrl,
          proofName: item.proofName,
        })),
      };
      CERT_PROVIDER_IDS.forEach((provider) => {
        next[provider] = payload;
      });
    }
    return next;
  }, [
    certificationMode,
    certificationsEnabled,
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
    profileMode,
    projectMode,
  ]);

  const importProviders = useMemo(() => {
    const socialProviders = selectedProviders.filter((provider) => {
      if (PROFILE_PROVIDER_IDS.includes(provider))
        return modeHasSocial(profileMode);
      if (PROJECT_PROVIDER_IDS.includes(provider))
        return modeHasSocial(projectMode);
      if (CERT_PROVIDER_IDS.includes(provider))
        return certificationsEnabled && modeHasSocial(certificationMode);
      return false;
    });
    return Array.from(
      new Set([
        ...socialProviders,
        ...(Object.keys(manualFallback) as Provider[]),
      ]),
    );
  }, [
    certificationMode,
    certificationsEnabled,
    manualFallback,
    profileMode,
    projectMode,
    selectedProviders,
  ]);

  const requireSession = useCallback(
    (reason: string) => {
      if (isAuthenticated && accessToken) return true;
      setStatusError(
        `Your session expired. Please sign in again to ${reason}.`,
      );
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

  const loadIntegrations = useCallback(async () => {
    if (!requireSession('load accounts')) return;
    setLoadingIntegrations(true);
    try {
      const rows = (await integrationsApi.list()) as IntegrationItem[];
      const rank = { primary: 0, secondary: 1, optional: 2 };
      setIntegrations(
        [...rows].sort((a, b) => rank[a.priority] - rank[b.priority]),
      );
    } catch (error) {
      handleApiError(error, 'Failed to load integrations.');
    } finally {
      setLoadingIntegrations(false);
    }
  }, [handleApiError, requireSession]);

  useEffect(() => {
    if (step === 2) void loadIntegrations();
  }, [loadIntegrations, step]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken || draftHydrated) return;
    let cancelled = false;

    const hydrateDraft = async () => {
      try {
        const latest = (await onboardingApi.getLatestImport()) as {
          runId?: string;
          status?: ImportStatus['status'];
          progressPct?: number;
          message?: string | null;
          draftAssetId?: string | null;
        } | null;
        if (!cancelled && latest?.runId) {
          const shouldRestore = window.confirm(
            'Unfinished AI import found. Restore and continue?',
          );
          if (shouldRestore) {
            setRunId(latest.runId);
            setStatus({
              runId: latest.runId,
              status: (latest.status ?? 'queued') as ImportStatus['status'],
              progressPct: latest.progressPct ?? 10,
              message: latest.message ?? undefined,
              draftAssetId: latest.draftAssetId ?? undefined,
            });
            setStep(latest.status === 'completed' ? 5 : 4);
            if (
              latest.status === 'awaiting_review' ||
              latest.status === 'partial'
            ) {
              try {
                const previewRes = (await onboardingApi.getImportPreview(
                  latest.runId,
                )) as { preview?: Record<string, unknown> };
                const nextConflicts = (previewRes.preview?.conflicts ??
                  []) as ImportConflict[];
                setConflicts(Array.isArray(nextConflicts) ? nextConflicts : []);
              } catch {
                // ignore preview fetch issues during hydration
              }
            }
            setDraftHydrated(true);
            return;
          }
        }
      } catch {
        // continue to local draft fallback
      }

      if (!cancelled && user.id && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(portfolioDraftKey(user.id));
          if (raw) {
            const parsed = JSON.parse(raw) as {
              step?: Step;
              setupMethod?: SetupMethod;
              activeTab?: ImportTab;
              persona?: Persona | `${Persona}`;
              focusQuestion?: string;
              profileMode?: ImportMode;
              projectMode?: ImportMode;
              certificationMode?: ImportMode;
              certificationsEnabled?: boolean;
              personalSiteUrl?: string;
              locationHint?: string;
              manualFullName?: string;
              manualProfessionalTitle?: string;
              manualBio?: string;
              manualSkills?: string;
              manualContactEmail?: string;
              manualProjects?: Array<{
                id?: string;
                title?: string;
                description?: string;
                tools?: string;
                caseStudy?: string;
                link?: string;
              }>;
              manualCertifications?: Array<{
                id?: string;
                title?: string;
                issuer?: string;
                date?: string;
                proofName?: string;
              }>;
            };
            const shouldRestore = window.confirm(
              'Saved local draft found. Restore it now?',
            );
            if (shouldRestore) {
              if (parsed.step) setStep(parsed.step);
              if (parsed.setupMethod) setSetupMethod(parsed.setupMethod);
              if (parsed.activeTab) setActiveTab(parsed.activeTab);
              if (parsed.persona) setPersona(parsed.persona);
              if (parsed.focusQuestion) setFocusQuestion(parsed.focusQuestion);
              if (parsed.profileMode) setProfileMode(parsed.profileMode);
              if (parsed.projectMode) setProjectMode(parsed.projectMode);
              if (parsed.certificationMode)
                setCertificationMode(parsed.certificationMode);
              if (typeof parsed.certificationsEnabled === 'boolean')
                setCertificationsEnabled(parsed.certificationsEnabled);
              if (parsed.personalSiteUrl)
                setPersonalSiteUrl(parsed.personalSiteUrl);
              if (parsed.locationHint) setLocationHint(parsed.locationHint);
              if (parsed.manualFullName)
                setManualFullName(parsed.manualFullName);
              if (parsed.manualProfessionalTitle)
                setManualProfessionalTitle(parsed.manualProfessionalTitle);
              if (parsed.manualBio) setManualBio(parsed.manualBio);
              if (parsed.manualSkills) setManualSkills(parsed.manualSkills);
              if (parsed.manualContactEmail)
                setManualContactEmail(parsed.manualContactEmail);
              if (
                Array.isArray(parsed.manualProjects) &&
                parsed.manualProjects.length > 0
              ) {
                setManualProjects(
                  parsed.manualProjects.map((item) => ({
                    id: item.id || crypto.randomUUID(),
                    title: item.title ?? '',
                    description: item.description ?? '',
                    tools: item.tools ?? '',
                    caseStudy: item.caseStudy ?? '',
                    link: item.link ?? '',
                    imageUrl: '',
                  })),
                );
              }
              if (
                Array.isArray(parsed.manualCertifications) &&
                parsed.manualCertifications.length > 0
              ) {
                setManualCertifications(
                  parsed.manualCertifications.map((item) => ({
                    id: item.id || crypto.randomUUID(),
                    title: item.title ?? '',
                    issuer: item.issuer ?? '',
                    date: item.date ?? '',
                    imageUrl: '',
                    proofUrl: '',
                    proofName: item.proofName ?? '',
                  })),
                );
              }
              setStatusNote('Local draft restored.');
            }
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
    if (!draftHydrated || !user.id || step > 3 || typeof window === 'undefined')
      return;
    const snapshot = {
      step,
      setupMethod,
      activeTab,
      persona,
      focusQuestion,
      profileMode,
      projectMode,
      certificationMode,
      certificationsEnabled,
      personalSiteUrl,
      locationHint,
      manualFullName,
      manualProfessionalTitle,
      manualBio,
      manualSkills,
      manualContactEmail,
      manualProjects: manualProjects.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        tools: item.tools,
        caseStudy: item.caseStudy,
        link: item.link,
      })),
      manualCertifications: manualCertifications.map((item) => ({
        id: item.id,
        title: item.title,
        issuer: item.issuer,
        date: item.date,
        proofName: item.proofName,
      })),
    };
    try {
      localStorage.setItem(
        portfolioDraftKey(user.id),
        JSON.stringify(snapshot),
      );
    } catch {
      // ignore storage issues
    }
  }, [
    activeTab,
    certificationMode,
    certificationsEnabled,
    draftHydrated,
    focusQuestion,
    locationHint,
    manualBio,
    manualCertifications,
    manualContactEmail,
    manualFullName,
    manualProfessionalTitle,
    manualProjects,
    manualSkills,
    persona,
    personalSiteUrl,
    profileMode,
    projectMode,
    setupMethod,
    step,
    user.id,
  ]);

  useEffect(() => {
    if (!runId || step !== 4) return;
    let stopped = false;
    const poll = async () => {
      try {
        if (!requireSession('continue import')) return;
        const next = (await onboardingApi.getImportStatus(
          runId,
        )) as ImportStatus;
        if (stopped) return;
        setStatus(next);
        if (next.status === 'awaiting_review' || next.status === 'partial') {
          const previewRes = (await onboardingApi.getImportPreview(runId)) as {
            preview?: Record<string, unknown>;
          };
          if (stopped) return;
          const nextConflicts = (previewRes.preview?.conflicts ??
            []) as ImportConflict[];
          setConflicts(Array.isArray(nextConflicts) ? nextConflicts : []);
        }
        if (next.status === 'completed') setStep(5);
      } catch (error) {
        if (!stopped) handleApiError(error, 'Unable to poll import status.');
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), 3000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [handleApiError, requireSession, runId, step]);

  useEffect(() => {
    if (publishSubdomain || !status?.draftAssetId) return;
    const base = slugify(
      manualFullName || user.name || `${String(persona)}-portfolio`,
    );
    if (base) setPublishSubdomain(base);
  }, [
    manualFullName,
    persona,
    publishSubdomain,
    status?.draftAssetId,
    user.name,
  ]);

  const connectProvider = async (provider: Provider) => {
    if (!requireSession('connect provider')) return;
    setConnectingProvider(provider);
    try {
      const res = (await integrationsApi.connect(provider)) as ConnectResponse;
      if (res.authUrl) {
        const token = localStorage.getItem('blox_access_token') ?? '';
        if (!token) {
          setStatusError('Missing access token. Please sign in again.');
          router.replace('/login');
          return;
        }
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_BASE_URL || window.location.origin;
        const authUrl = new URL(res.authUrl, baseUrl);
        authUrl.searchParams.set('token', token);
        window.location.href = authUrl.toString();
        return;
      }
      if (res.connected)
        setIntegrations((prev) =>
          prev.map((item) =>
            item.id === provider ? { ...item, connected: true } : item,
          ),
        );
    } catch (error) {
      handleApiError(error, 'Failed to connect provider.');
    } finally {
      setConnectingProvider(null);
    }
  };

  const disconnectProvider = async (provider: Provider) => {
    if (!requireSession('disconnect provider')) return;
    setDisconnectingProvider(provider);
    try {
      await integrationsApi.disconnect(provider);
      setIntegrations((prev) =>
        prev.map((item) =>
          item.id === provider ? { ...item, connected: false } : item,
        ),
      );
    } catch (error) {
      handleApiError(error, 'Failed to disconnect provider.');
    } finally {
      setDisconnectingProvider(null);
    }
  };

  const startImport = async () => {
    if (!requireSession('start AI optimization')) return;
    if (importProviders.length === 0) {
      setStatusError(
        'Connect at least one provider or enter manual data first.',
      );
      return;
    }
    setStartingImport(true);
    setStatusError('');
    try {
      const res = (await onboardingApi.startImport({
        persona,
        providers: importProviders,
        personalSiteUrl: personalSiteUrl || undefined,
        locationHint: locationHint || undefined,
        focusQuestion: focusQuestion || undefined,
        manualFallback:
          Object.keys(manualFallback).length > 0 ? manualFallback : undefined,
      })) as ImportStatus;
      setRunId(res.runId);
      setStatus(res);
      setConflicts([]);
      setStep(4);
      setStatusNote('AI optimization started.');
      if (user.id && typeof window !== 'undefined') {
        localStorage.removeItem(portfolioDraftKey(user.id));
      }
    } catch (error) {
      handleApiError(error, 'Failed to start import.');
    } finally {
      setStartingImport(false);
    }
  };

  const confirmImport = async () => {
    if (!runId) return;
    if (!requireSession('finalize import')) return;
    setConfirming(true);
    try {
      const res = (await onboardingApi.confirmImport(runId, {
        overrides,
        acceptAutoMerge: true,
      })) as { draftAssetId?: string | null };
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              draftAssetId: res.draftAssetId ?? prev.draftAssetId,
              status: 'completed',
              progressPct: 100,
            }
          : prev,
      );
      setStep(5);
      if (user.id && typeof window !== 'undefined') {
        localStorage.removeItem(portfolioDraftKey(user.id));
      }
    } catch (error) {
      handleApiError(error, 'Failed to finalize draft.');
    } finally {
      setConfirming(false);
    }
  };

  const handleProfileImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setManualProfileImageUrl(dataUrl);
  };

  const handleProjectFileUpload = async (
    id: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setManualProjects((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, imageUrl: dataUrl } : item,
      ),
    );
  };

  const handleCertificationProofUpload = async (
    id: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setManualCertifications((prev) =>
      prev.map((item) =>
        item.id === id
          ? file.type.startsWith('image/')
            ? { ...item, imageUrl: dataUrl }
            : { ...item, proofUrl: dataUrl, proofName: file.name }
          : item,
      ),
    );
  };

  const persistDraftSnapshot = useCallback(
    (withNote = false) => {
      if (!user.id || typeof window === 'undefined') return;
      const snapshot = {
        step,
        setupMethod,
        activeTab,
        persona,
        focusQuestion,
        profileMode,
        projectMode,
        certificationMode,
        certificationsEnabled,
        personalSiteUrl,
        locationHint,
        manualFullName,
        manualProfessionalTitle,
        manualBio,
        manualSkills,
        manualContactEmail,
        manualProjects: manualProjects.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          tools: item.tools,
          caseStudy: item.caseStudy,
          link: item.link,
        })),
        manualCertifications: manualCertifications.map((item) => ({
          id: item.id,
          title: item.title,
          issuer: item.issuer,
          date: item.date,
          proofName: item.proofName,
        })),
      };
      try {
        localStorage.setItem(
          portfolioDraftKey(user.id),
          JSON.stringify(snapshot),
        );
        if (withNote)
          setStatusNote('Draft saved. You can resume from dashboard.');
      } catch {
        // ignore storage issues
      }
    },
    [
      activeTab,
      certificationMode,
      certificationsEnabled,
      focusQuestion,
      locationHint,
      manualBio,
      manualCertifications,
      manualContactEmail,
      manualFullName,
      manualProfessionalTitle,
      manualProjects,
      manualSkills,
      persona,
      profileMode,
      projectMode,
      setupMethod,
      step,
      user.id,
      personalSiteUrl,
    ],
  );

  const copyPublishedLink = async () => {
    if (
      !publishedUrl ||
      typeof navigator === 'undefined' ||
      !navigator.clipboard
    ) {
      setStatusError('Unable to copy link on this browser.');
      return;
    }
    try {
      await navigator.clipboard.writeText(publishedUrl);
      setStatusNote('Published link copied.');
    } catch {
      setStatusError('Unable to copy link.');
    }
  };

  const publishDraft = async () => {
    if (!status?.draftAssetId) {
      setStatusError('Draft asset not available yet.');
      return;
    }
    if (!requireSession('publish portfolio')) return;
    if (publishVisibility === 'PRIVATE') {
      setPublishing(true);
      try {
        await assetsApi.update(status.draftAssetId, { visibility: 'PRIVATE' });
        setStatusNote('Portfolio kept private. You can publish later.');
      } catch (error) {
        handleApiError(error, 'Failed to update visibility.');
      } finally {
        setPublishing(false);
      }
      return;
    }

    const seed =
      publishSubdomain ||
      slugify(manualFullName || user.name || `${String(persona)}-portfolio`);
    if (!seed) {
      setStatusError('Add a subdomain before publishing.');
      return;
    }

    setPublishing(true);
    setStatusError('');
    try {
      const response = (await publishApi.publish({
        assetId: status.draftAssetId,
        subdomain: seed,
        customDomain: publishCustomDomain || undefined,
      })) as { publishedUrl?: string; subdomain?: string };

      if (publishVisibility === 'UNLISTED') {
        await assetsApi.update(status.draftAssetId, { visibility: 'UNLISTED' });
      }
      setPublishSubdomain(response.subdomain ?? seed);
      setPublishedUrl(response.publishedUrl ?? '');
      setSubdomainSuggestions([]);
      setStatusNote('Portfolio published successfully.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to publish portfolio.';
      if (/taken|reserved/i.test(message)) {
        const base = slugify(seed) || 'my-portfolio';
        const suggestions = [1, 2, 3].map((index) => `${base}-${index}`);
        setSubdomainSuggestions(suggestions);
        setStatusError(
          'Subdomain unavailable. Pick one of the suggested alternatives.',
        );
      } else {
        setStatusError(message);
      }
    } finally {
      setPublishing(false);
    }
  };

  const renderProviderCards = (providers: Provider[]) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {providers.map((provider) => {
        const integration = integrations.find((item) => item.id === provider);
        const meta = PROVIDER_META[provider];
        if (!integration)
          return (
            <div
              key={provider}
              className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500"
            >
              {meta.label} unavailable
            </div>
          );
        return (
          <div
            key={provider}
            className={`rounded-xl border p-3 ${integration.connected ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={meta.logoUrl}
                  alt={`${meta.label} logo`}
                  className="h-4 w-4"
                />
                <p className="text-xs font-semibold text-slate-800">
                  {meta.label}
                </p>
              </div>
              <span className="text-[10px] text-slate-500">
                {integration.connected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            {integration.connected ? (
              <button
                type="button"
                onClick={() => void disconnectProvider(provider)}
                disabled={disconnectingProvider === provider}
                className="w-full rounded-md border border-rose-200 bg-rose-50 py-1 text-xs font-semibold text-rose-700"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void connectProvider(provider)}
                disabled={connectingProvider === provider}
                className="w-full rounded-md bg-indigo-600 py-1 text-xs font-semibold text-white"
              >
                Connect
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  const previewProjects = normalizedManualProjects
    .slice(0, 4)
    .map((item) => item.title || 'Untitled');
  const previewCertifications = normalizedManualCertifications
    .slice(0, 4)
    .map((item) => item.title || 'Untitled');
  const autoFillEstimate = Math.max(
    60,
    Math.min(
      90,
      60 +
        importProviders.length * 7 +
        (normalizedManualProjects.length > 0 ? 8 : 0),
    ),
  );
  const personaTip =
    PERSONA_AI_TIPS[String(persona)] ?? PERSONA_AI_TIPS.default;
  const aiSuggestions = [
    `Refine your bio for ${String(persona).toLowerCase()} positioning`,
    focusQuestion
      ? `Add keyword cluster from "${focusQuestion}"`
      : 'Add role/location keyword cluster',
    locationHint
      ? `Boost local SEO for ${locationHint}`
      : 'Include location-specific SEO terms',
    'Improve project impact statements with measurable outcomes',
  ];

  return (
    <AuthGuard>
      <FeaturePage
        title="Create New Portfolio"
        description="Refined 5-step flow with hybrid social + manual import."
      >
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 h-2 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-5">
              {[1, 2, 3, 4, 5].map((id) => (
                <div
                  key={id}
                  className={`rounded-lg border px-2 py-1 text-xs font-semibold ${step === id ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`}
                >
                  Step {id}/5
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={step === 1}
                  onClick={() =>
                    setStep((prev) => Math.max(1, prev - 1) as Step)
                  }
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={step === 5}
                  onClick={() =>
                    setStep((prev) => Math.min(5, prev + 1) as Step)
                  }
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  Forward
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => persistDraftSnapshot(true)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    persistDraftSnapshot(false);
                    router.push('/portfolios');
                  }}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                >
                  Save & Exit
                </button>
              </div>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Quick Start & Persona Selection
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setSetupMethod('social');
                    setProfileMode('social');
                    setProjectMode('hybrid');
                    setCertificationMode('hybrid');
                    setCertificationsEnabled(true);
                  }}
                  className={`rounded-xl border p-4 text-left ${setupMethod === 'social' ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}
                >
                  <p className="text-sm font-semibold text-slate-900">
                    Social Import
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Fast auto-fill from linked accounts, then add manual items
                    in hybrid mode.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSetupMethod('manual');
                    setProfileMode('manual');
                    setProjectMode('manual');
                    setCertificationMode('manual');
                  }}
                  className={`rounded-xl border p-4 text-left ${setupMethod === 'manual' ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}
                >
                  <p className="text-sm font-semibold text-slate-900">
                    Manual Setup
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Fill sections yourself and optionally enrich with local
                    files.
                  </p>
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {PERSONA_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPersona(option.value)}
                    className={`rounded-xl border p-3 text-left ${persona === option.value ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {option.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{option.desc}</p>
                  </button>
                ))}
              </div>
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-700">
                <p className="font-semibold">AI tip</p>
                <p>{personaTip}</p>
              </div>
              <input
                value={focusQuestion}
                onChange={(e) => setFocusQuestion(e.target.value)}
                placeholder="Optional focus question (e.g. Tech job hunt in Lagos)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSetupMethod('manual');
                    setProfileMode('manual');
                    setProjectMode('manual');
                    setCertificationMode('manual');
                    setStep(2);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold"
                >
                  Skip to Manual
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  Continue <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-xl font-semibold text-slate-900">
                  Unified Import Hub
                </h2>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {(
                    ['profile', 'projects', 'certifications'] as ImportTab[]
                  ).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeTab === 'profile' && (
                  <div className="space-y-3">
                    <div className="inline-flex rounded-lg border border-slate-200 p-1">
                      {(['social', 'hybrid', 'manual'] as ImportMode[]).map(
                        (mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setProfileMode(mode)}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${profileMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}
                          >
                            {mode}
                          </button>
                        ),
                      )}
                    </div>
                    {modeHasSocial(profileMode) &&
                      (loadingIntegrations ? (
                        <p className="text-sm text-slate-500">Loading...</p>
                      ) : (
                        renderProviderCards(PROFILE_PROVIDER_IDS)
                      ))}
                    {modeHasManual(profileMode) && (
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          value={manualFullName}
                          onChange={(e) => setManualFullName(e.target.value)}
                          placeholder="Full name"
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                          value={manualProfessionalTitle}
                          onChange={(e) =>
                            setManualProfessionalTitle(e.target.value)
                          }
                          placeholder="Professional title"
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <textarea
                          value={manualBio}
                          onChange={(e) => setManualBio(e.target.value)}
                          placeholder="Bio"
                          rows={3}
                          className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <textarea
                          value={manualSkills}
                          onChange={(e) => setManualSkills(e.target.value)}
                          placeholder="Skills"
                          rows={2}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                          value={manualContactEmail}
                          onChange={(e) =>
                            setManualContactEmail(e.target.value)
                          }
                          placeholder="Email"
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                          value={personalSiteUrl}
                          onChange={(e) => setPersonalSiteUrl(e.target.value)}
                          placeholder="Personal site URL"
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                          value={locationHint}
                          onChange={(e) => setLocationHint(e.target.value)}
                          placeholder="Location hint"
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => void handleProfileImageUpload(e)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                        />
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div className="space-y-3">
                    <div className="inline-flex rounded-lg border border-slate-200 p-1">
                      {(['social', 'hybrid', 'manual'] as ImportMode[]).map(
                        (mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setProjectMode(mode)}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${projectMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}
                          >
                            {mode}
                          </button>
                        ),
                      )}
                    </div>
                    {modeHasSocial(projectMode) &&
                      (loadingIntegrations ? (
                        <p className="text-sm text-slate-500">Loading...</p>
                      ) : (
                        renderProviderCards(PROJECT_PROVIDER_IDS)
                      ))}
                    {modeHasManual(projectMode) && (
                      <div className="space-y-2">
                        {manualProjects.map((project, idx) => (
                          <div
                            key={project.id}
                            draggable
                            onDragStart={() => setDraggingProjectId(project.id)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() =>
                              setManualProjects((prev) =>
                                reorderById(
                                  prev,
                                  draggingProjectId,
                                  project.id,
                                ),
                              )
                            }
                            onDragEnd={() => setDraggingProjectId('')}
                            className={`space-y-2 rounded-xl border p-3 ${draggingProjectId === project.id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200'}`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-slate-600">
                                Project {idx + 1}
                              </p>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setManualProjects((prev) => {
                                      if (idx === 0) return prev;
                                      return reorderById(
                                        prev,
                                        project.id,
                                        prev[idx - 1].id,
                                      );
                                    })
                                  }
                                  className="rounded border border-slate-300 px-2 py-0.5 text-[10px]"
                                >
                                  Up
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setManualProjects((prev) => {
                                      if (idx === prev.length - 1) return prev;
                                      return reorderById(
                                        prev,
                                        project.id,
                                        prev[idx + 1].id,
                                      );
                                    })
                                  }
                                  className="rounded border border-slate-300 px-2 py-0.5 text-[10px]"
                                >
                                  Down
                                </button>
                              </div>
                            </div>
                            <input
                              value={project.title}
                              onChange={(e) =>
                                setManualProjects((prev) =>
                                  prev.map((it) =>
                                    it.id === project.id
                                      ? { ...it, title: e.target.value }
                                      : it,
                                  ),
                                )
                              }
                              placeholder="Title"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <textarea
                              value={project.description}
                              onChange={(e) =>
                                setManualProjects((prev) =>
                                  prev.map((it) =>
                                    it.id === project.id
                                      ? { ...it, description: e.target.value }
                                      : it,
                                  ),
                                )
                              }
                              placeholder="Description"
                              rows={2}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <input
                              value={project.tools}
                              onChange={(e) =>
                                setManualProjects((prev) =>
                                  prev.map((it) =>
                                    it.id === project.id
                                      ? { ...it, tools: e.target.value }
                                      : it,
                                  ),
                                )
                              }
                              placeholder="Tools / stack (comma separated)"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <textarea
                              value={project.caseStudy}
                              onChange={(e) =>
                                setManualProjects((prev) =>
                                  prev.map((it) =>
                                    it.id === project.id
                                      ? { ...it, caseStudy: e.target.value }
                                      : it,
                                  ),
                                )
                              }
                              placeholder="Case study summary (optional)"
                              rows={2}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <input
                              value={project.link}
                              onChange={(e) =>
                                setManualProjects((prev) =>
                                  prev.map((it) =>
                                    it.id === project.id
                                      ? { ...it, link: e.target.value }
                                      : it,
                                  ),
                                )
                              }
                              placeholder="Link"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                void handleProjectFileUpload(project.id, e)
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setManualProjects((prev) => [
                              ...prev,
                              DEFAULT_MANUAL_PROJECT(),
                            ])
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                        >
                          <Plus className="h-3.5 w-3.5" />+ Add Custom
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'certifications' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs font-semibold text-slate-700">
                        Certifications are optional
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setCertificationsEnabled((prev) => !prev)
                        }
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                      >
                        {certificationsEnabled
                          ? 'Skip Section'
                          : 'Enable Section'}
                      </button>
                    </div>
                    {certificationsEnabled && (
                      <>
                        <div className="inline-flex rounded-lg border border-slate-200 p-1">
                          {(['social', 'hybrid', 'manual'] as ImportMode[]).map(
                            (mode) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setCertificationMode(mode)}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${certificationMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}
                              >
                                {mode}
                              </button>
                            ),
                          )}
                        </div>
                        {modeHasSocial(certificationMode) &&
                          (loadingIntegrations ? (
                            <p className="text-sm text-slate-500">Loading...</p>
                          ) : (
                            renderProviderCards(CERT_PROVIDER_IDS)
                          ))}
                        {modeHasManual(certificationMode) && (
                          <div className="space-y-2">
                            {manualCertifications.map((cert, idx) => (
                              <div
                                key={cert.id}
                                draggable
                                onDragStart={() =>
                                  setDraggingCertificationId(cert.id)
                                }
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={() =>
                                  setManualCertifications((prev) =>
                                    reorderById(
                                      prev,
                                      draggingCertificationId,
                                      cert.id,
                                    ),
                                  )
                                }
                                onDragEnd={() => setDraggingCertificationId('')}
                                className={`space-y-2 rounded-xl border p-3 ${draggingCertificationId === cert.id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold text-slate-600">
                                    Certification {idx + 1}
                                  </p>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setManualCertifications((prev) => {
                                          if (idx === 0) return prev;
                                          return reorderById(
                                            prev,
                                            cert.id,
                                            prev[idx - 1].id,
                                          );
                                        })
                                      }
                                      className="rounded border border-slate-300 px-2 py-0.5 text-[10px]"
                                    >
                                      Up
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setManualCertifications((prev) => {
                                          if (idx === prev.length - 1)
                                            return prev;
                                          return reorderById(
                                            prev,
                                            cert.id,
                                            prev[idx + 1].id,
                                          );
                                        })
                                      }
                                      className="rounded border border-slate-300 px-2 py-0.5 text-[10px]"
                                    >
                                      Down
                                    </button>
                                  </div>
                                </div>
                                <input
                                  value={cert.title}
                                  onChange={(e) =>
                                    setManualCertifications((prev) =>
                                      prev.map((it) =>
                                        it.id === cert.id
                                          ? { ...it, title: e.target.value }
                                          : it,
                                      ),
                                    )
                                  }
                                  placeholder="Title"
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                                <input
                                  value={cert.issuer}
                                  onChange={(e) =>
                                    setManualCertifications((prev) =>
                                      prev.map((it) =>
                                        it.id === cert.id
                                          ? { ...it, issuer: e.target.value }
                                          : it,
                                      ),
                                    )
                                  }
                                  placeholder="Issuer"
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                                <input
                                  value={cert.date}
                                  onChange={(e) =>
                                    setManualCertifications((prev) =>
                                      prev.map((it) =>
                                        it.id === cert.id
                                          ? { ...it, date: e.target.value }
                                          : it,
                                      ),
                                    )
                                  }
                                  placeholder="Date"
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  onChange={(e) =>
                                    void handleCertificationProofUpload(
                                      cert.id,
                                      e,
                                    )
                                  }
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                                />
                                {cert.proofName && (
                                  <p className="text-xs text-slate-500">
                                    Proof attached: {cert.proofName}
                                  </p>
                                )}
                                {cert.imageUrl && (
                                  <img
                                    src={cert.imageUrl}
                                    alt={`${cert.title || 'Certification'} preview`}
                                    className="h-28 w-full rounded-lg border border-slate-200 object-cover"
                                  />
                                )}
                                {cert.proofUrl &&
                                  cert.proofUrl.startsWith(
                                    'data:application/pdf',
                                  ) && (
                                    <iframe
                                      src={cert.proofUrl}
                                      title={`${cert.title || 'Certification'} PDF preview`}
                                      className="h-40 w-full rounded-lg border border-slate-200 bg-white"
                                    />
                                  )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                setManualCertifications((prev) => [
                                  ...prev,
                                  DEFAULT_MANUAL_CERTIFICATION(),
                                ])
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                            >
                              <Plus className="h-3.5 w-3.5" />+ Add Local Cert
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                  <p className="text-xs font-semibold text-indigo-700">
                    AI Quick Actions
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      value={quickFillUrl}
                      onChange={(e) => setQuickFillUrl(e.target.value)}
                      placeholder="Paste URL for quick fill"
                      className="min-w-[220px] flex-1 rounded-lg border border-indigo-200 px-3 py-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          quickFillUrl.toLowerCase().includes('github') ||
                          quickFillUrl.toLowerCase().includes('behance') ||
                          quickFillUrl.toLowerCase().includes('figma')
                        ) {
                          setProjectMode('hybrid');
                          setActiveTab('projects');
                        }
                        if (
                          quickFillUrl.toLowerCase().includes('udemy') ||
                          quickFillUrl.toLowerCase().includes('coursera')
                        ) {
                          setCertificationsEnabled(true);
                          setCertificationMode('hybrid');
                          setActiveTab('certifications');
                        }
                        setStatusNote('Quick fill applied.');
                        setQuickFillUrl('');
                      }}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Quick Fill
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Set([
                          ...manualSkillList,
                          'Communication',
                          'Collaboration',
                          'Problem Solving',
                        ]);
                        setManualSkills(Array.from(next).join(', '));
                      }}
                      className="rounded-lg border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700"
                    >
                      Suggest skills?
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Continue
                  </button>
                </div>
              </div>

              <aside className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-800">
                  Live Draft Preview
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {manualFullName || user.name || 'Your Name'}
                  </p>
                  <p className="text-xs text-slate-600">
                    {manualProfessionalTitle || `${persona} Portfolio`}
                  </p>
                  <p className="mt-2 text-xs text-slate-700">
                    {manualBio || 'Profile summary will appear here.'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Projects
                  </p>
                  {previewProjects.length > 0 ? (
                    previewProjects.map((project) => (
                      <p key={project} className="text-xs text-slate-700">
                        {project}
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">
                      Projects will appear here.
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Certifications
                  </p>
                  {previewCertifications.length > 0 ? (
                    previewCertifications.map((cert) => (
                      <p key={cert} className="text-xs text-slate-700">
                        {cert}
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">
                      Optional section is empty.
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                  <p className="text-xs font-semibold text-indigo-700">
                    Auto-fill score
                  </p>
                  <p className="text-2xl font-bold text-indigo-800">
                    {autoFillEstimate}%
                  </p>
                  <p className="text-xs text-indigo-700">Target: 80-90%</p>
                </div>
              </aside>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">
                AI Optimization & Customization
              </h2>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-500">
                    Persona
                  </p>
                  <p className="text-sm text-slate-700">{String(persona)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-500">Focus</p>
                  <p className="text-sm text-slate-700">
                    {focusQuestion || 'General optimization'}
                  </p>
                </div>
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                  <p className="text-xs font-semibold text-indigo-700">
                    Health score
                  </p>
                  <p className="text-2xl font-bold text-indigo-800">
                    {autoFillEstimate}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    AI Suggestions
                  </p>
                  <div className="inline-flex rounded border border-slate-300 p-0.5">
                    {(['desktop', 'mobile'] as const).map((device) => (
                      <button
                        key={device}
                        type="button"
                        onClick={() => setPreviewDevice(device)}
                        className={`rounded px-2 py-1 text-[10px] font-semibold capitalize ${previewDevice === device ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                      >
                        {device}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {aiSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() =>
                        setStatusNote(`Applied suggestion: ${suggestion}`)
                      }
                      className="min-w-[220px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <div
                  className={`mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 ${previewDevice === 'mobile' ? 'max-w-[320px]' : ''}`}
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {manualFullName || user.name || 'Your Name'}
                  </p>
                  <p className="text-xs text-slate-600">
                    {manualProfessionalTitle || `${persona} Portfolio`}
                  </p>
                  <p className="mt-1 text-xs text-slate-700">
                    {manualBio ||
                      'AI will refine your profile summary after optimization.'}
                  </p>
                </div>
              </div>
              {normalizedManualProjects.length === 0 &&
                importProviders.length < 2 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    Sparse data detected. Add at least one manual project for a
                    stronger draft.
                  </div>
                )}
              <div className="flex flex-wrap justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold"
                >
                  Back
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setStatusNote('Generated alternate AI variations.')
                    }
                    className="rounded-lg border border-indigo-300 px-4 py-2 text-xs font-semibold text-indigo-700"
                  >
                    Generate Variations
                  </button>
                  <button
                    type="button"
                    onClick={() => void startImport()}
                    disabled={startingImport}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {startingImport ? 'Starting...' : 'Run AI Optimization'}{' '}
                    <Zap className="h-4 w-4 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Review & Finalize
              </h2>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    ATS Estimate
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {autoFillEstimate}%
                  </p>
                  <p className="text-xs text-slate-500">
                    Keywords: {aiSuggestions[1]}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Checklist
                  </p>
                  <div className="mt-2 grid gap-1 text-xs text-slate-700 md:grid-cols-2">
                    <p>
                      {manualFullName || user.name ? 'Done' : 'Pending'}: Name
                    </p>
                    <p>
                      {normalizedManualProjects.length > 0 ||
                      importProviders.some((provider) =>
                        PROJECT_PROVIDER_IDS.includes(provider),
                      )
                        ? 'Done'
                        : 'Pending'}
                      : Projects
                    </p>
                    <p>
                      {manualSkillList.length > 0 ? 'Done' : 'Pending'}: Skills
                    </p>
                    <p>
                      {certificationsEnabled
                        ? 'Optional enabled'
                        : 'Skipped by user'}
                      : Certifications
                    </p>
                  </div>
                </div>
              </div>
              {status?.status === 'queued' || status?.status === 'running' ? (
                <div className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-center">
                  <Bot className="mx-auto h-8 w-8 text-indigo-700" />
                  <p className="text-sm font-semibold text-indigo-800">
                    AI is processing your draft...
                  </p>
                  <div className="mx-auto h-2 w-full max-w-xl rounded-full bg-indigo-100">
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{ width: `${status.progressPct ?? 10}%` }}
                    />
                  </div>
                  <p className="text-xs text-indigo-700">
                    {status.progressPct ?? 10}% complete
                  </p>
                </div>
              ) : status?.status === 'failed' ? (
                <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-700">
                    {status.message ?? 'Import failed.'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                    >
                      Optimize More
                    </button>
                    <button
                      type="button"
                      onClick={() => void startImport()}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Conflicts
                    </p>
                    {conflicts.length === 0 ? (
                      <p className="text-sm text-emerald-700">
                        No major conflicts found. Auto-resolve is ready.
                      </p>
                    ) : (
                      conflicts.map((conflict) => (
                        <div
                          key={conflict.field}
                          className="mt-2 rounded-lg border border-slate-200 p-2"
                        >
                          <p className="text-xs text-slate-500">
                            {conflict.field} (suggested:{' '}
                            {conflict.recommendedProvider})
                          </p>
                          <input
                            value={
                              overrides[conflict.field] ??
                              conflict.recommendedValue
                            }
                            onChange={(e) =>
                              setOverrides((prev) => ({
                                ...prev,
                                [conflict.field]: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                      >
                        Optimize More
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                      >
                        PDF Preview Download
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setStatusNote(
                            'Extras queued. You can add e-commerce and advanced sections in the editor.',
                          )
                        }
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                      >
                        Add Extras
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => void confirmImport()}
                      disabled={confirming}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      {confirming ? 'Finalizing...' : 'Finalize Draft'}{' '}
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <h2 className="text-xl font-semibold text-emerald-900">
                Publish & Share
              </h2>
              <p className="text-sm text-emerald-800">
                Choose visibility, publish, and share your new portfolio.
              </p>
              <div className="grid gap-2 md:grid-cols-3">
                <input
                  value={publishSubdomain}
                  onChange={(event) =>
                    setPublishSubdomain(slugify(event.target.value))
                  }
                  placeholder="Subdomain"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={publishCustomDomain}
                  onChange={(event) =>
                    setPublishCustomDomain(event.target.value)
                  }
                  placeholder="Custom domain (optional)"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <select
                  value={publishVisibility}
                  onChange={(event) =>
                    setPublishVisibility(
                      event.target.value as 'PUBLIC' | 'PRIVATE' | 'UNLISTED',
                    )
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="UNLISTED">Unlisted</option>
                  <option value="PRIVATE">Private (skip publish)</option>
                </select>
              </div>
              {subdomainSuggestions.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-800">
                    Suggestions
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {subdomainSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setPublishSubdomain(suggestion)}
                        className="rounded border border-amber-300 bg-white px-2 py-1 text-xs font-semibold text-amber-800"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void publishDraft()}
                  disabled={publishing || !status?.draftAssetId}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {publishing ? 'Publishing...' : 'Publish Now'}
                </button>
                {publishedUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => window.open(publishedUrl, '_blank')}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                    >
                      View Site
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyPublishedLink()}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                    >
                      Copy Link
                    </button>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publishedUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                    >
                      Share on LinkedIn
                    </a>
                  </>
                )}
                {status?.draftAssetId && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/portfolios/${status.draftAssetId}/edit`)
                    }
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                  >
                    Open Editor
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => router.push('/portfolios')}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Back to Portfolios
                </button>
              </div>
              {publishedUrl && (
                <div className="rounded-xl border border-emerald-300 bg-white p-3 text-xs text-emerald-800">
                  Live URL: {publishedUrl}
                </div>
              )}
            </div>
          )}

          {statusError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {statusError}
            </div>
          )}
          {statusNote && !statusError && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
              {statusNote}
            </div>
          )}
        </div>
      </FeaturePage>
    </AuthGuard>
  );
}
