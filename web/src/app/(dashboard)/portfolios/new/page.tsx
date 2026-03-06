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
import {
  Check,
  Zap,
  Bot,
  ArrowUpRight,
  Plus,
  GraduationCap,
  BriefcaseBusiness,
  User,
  Star,
  Target,
  Sparkles,
  Search,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  LayoutDashboard,
  SidebarRight,
  CheckCircle,
  Clock,
  PlusCircle,
  Download,
  X,
} from '@/components/ui/icons';

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

const PERSONA_OPTIONS: Array<{
  value: Persona;
  label: string;
  desc: string;
  icon: any;
}> = [
  {
    value: Persona.FREELANCER,
    label: 'Freelancer',
    desc: 'Conversion-first storytelling.',
    icon: Star,
  },
  {
    value: Persona.JOB_SEEKER,
    label: 'Job Seeker',
    desc: 'ATS-friendly recruiter narrative.',
    icon: Search,
  },
  {
    value: Persona.STUDENT,
    label: 'Student',
    desc: 'Potential, internships, and growth.',
    icon: GraduationCap,
  },
  {
    value: Persona.PROFESSIONAL,
    label: 'Professional',
    desc: 'Clean and credible positioning.',
    icon: BriefcaseBusiness,
  },
  {
    value: Persona.EXECUTIVE,
    label: 'Executive',
    desc: 'Strategic leadership outcomes.',
    icon: Target,
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

function sanitizeImportPayloadValue(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('data:')) return '';
    return trimmed;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeImportPayloadValue(item))
      .filter((item) => {
        if (item === '' || item === null || item === undefined) return false;
        if (Array.isArray(item)) return item.length > 0;
        if (typeof item === 'object') return Object.keys(item as Record<string, unknown>).length > 0;
        return true;
      });
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, sanitizeImportPayloadValue(item)] as const)
      .filter(([, item]) => {
        if (item === '' || item === null || item === undefined) return false;
        if (Array.isArray(item)) return item.length > 0;
        if (typeof item === 'object') return Object.keys(item as Record<string, unknown>).length > 0;
        return true;
      });
    return Object.fromEntries(entries);
  }
  return value;
}

function sanitizeManualFallbackForImport(input: Record<string, unknown>) {
  const cleaned = sanitizeImportPayloadValue(input);
  if (!cleaned || typeof cleaned !== 'object' || Array.isArray(cleaned)) return {};
  return cleaned as Record<string, unknown>;
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
  const [showDraftRestoration, setShowDraftRestoration] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<any>(null);

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

  const importManualFallback = useMemo(
    () => sanitizeManualFallbackForImport(manualFallback),
    [manualFallback],
  );

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

    const checkDrafts = async () => {
      try {
        const latest = (await onboardingApi.getLatestImport()) as any;
        if (!cancelled && latest?.runId) {
          setPendingDraft({ type: 'ai', data: latest });
          setShowDraftRestoration(true);
          return;
        }
      } catch {
        // continue to local draft
      }

      if (!cancelled && user.id && typeof window !== 'undefined') {
        const raw = localStorage.getItem(portfolioDraftKey(user.id));
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setPendingDraft({ type: 'local', data: parsed });
            setShowDraftRestoration(true);
          } catch {
            // ignore malformed
          }
        }
      }
      setDraftHydrated(true);
    };

    void checkDrafts();
    return () => {
      cancelled = true;
    };
  }, [accessToken, draftHydrated, isAuthenticated, user.id]);

  const restoreDraft = useCallback(async () => {
    if (!pendingDraft) return;
    const { type, data } = pendingDraft;

    if (type === 'ai') {
      setRunId(data.runId);
      setStatus({
        runId: data.runId,
        status: (data.status ?? 'queued') as ImportStatus['status'],
        progressPct: data.progressPct ?? 10,
        message: data.message ?? undefined,
        draftAssetId: data.draftAssetId ?? undefined,
      });
      setStep(data.status === 'completed' ? 5 : 4);
      if (data.status === 'awaiting_review' || data.status === 'partial') {
        try {
          const previewRes = (await onboardingApi.getImportPreview(
            data.runId,
          )) as any;
          const nextConflicts = (previewRes.preview?.conflicts ??
            []) as ImportConflict[];
          setConflicts(Array.isArray(nextConflicts) ? nextConflicts : []);
        } catch {
          /* ignore */
        }
      }
    } else {
      if (data.step) setStep(data.step);
      if (data.setupMethod) setSetupMethod(data.setupMethod);
      if (data.activeTab) setActiveTab(data.activeTab);
      if (data.persona) setPersona(data.persona);
      if (data.focusQuestion) setFocusQuestion(data.focusQuestion);
      if (data.profileMode) setProfileMode(data.profileMode);
      if (data.projectMode) setProjectMode(data.projectMode);
      if (data.certificationMode) setCertificationMode(data.certificationMode);
      if (typeof data.certificationsEnabled === 'boolean')
        setCertificationsEnabled(data.certificationsEnabled);
      if (data.personalSiteUrl) setPersonalSiteUrl(data.personalSiteUrl);
      if (data.locationHint) setLocationHint(data.locationHint);
      if (data.manualFullName) setManualFullName(data.manualFullName);
      if (data.manualProfessionalTitle)
        setManualProfessionalTitle(data.manualProfessionalTitle);
      if (data.manualBio) setManualBio(data.manualBio);
      if (data.manualSkills) setManualSkills(data.manualSkills);
      if (data.manualContactEmail)
        setManualContactEmail(data.manualContactEmail);
      if (Array.isArray(data.manualProjects)) {
        setManualProjects(
          data.manualProjects.map((item: any) => ({
            ...DEFAULT_MANUAL_PROJECT(),
            ...item,
          })),
        );
      }
      if (Array.isArray(data.manualCertifications)) {
        setManualCertifications(
          data.manualCertifications.map((item: any) => ({
            ...DEFAULT_MANUAL_CERTIFICATION(),
            ...item,
          })),
        );
      }
      setStatusNote('Local draft restored.');
    }
    setShowDraftRestoration(false);
    setPendingDraft(null);
  }, [pendingDraft]);

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
      /* ignore */
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
          const previewRes = (await onboardingApi.getImportPreview(
            runId,
          )) as any;
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
          Object.keys(importManualFallback).length > 0
            ? importManualFallback
            : undefined,
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
      })) as any;
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
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-2">
      {providers.map((provider) => {
        const integration = integrations.find((item) => item.id === provider);
        const meta = PROVIDER_META[provider];
        if (!integration) return null;
        return (
          <div
            key={provider}
            className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
              integration.connected
                ? 'border-[#1ECEFA]/30 bg-[#1ECEFA]/5 shadow-[0_0_15px_rgba(30,206,250,0.1)]'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 p-2">
                  <img
                    src={meta.logoUrl}
                    alt={meta.label}
                    className="h-6 w-6 object-contain"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{meta.label}</p>
                  <p className="text-[10px] text-slate-400">
                    {integration.connected ? 'Connected' : 'Not Linked'}
                  </p>
                </div>
              </div>
              {integration.connected && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1ECEFA]/20 text-[#1ECEFA]">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </div>
            {integration.connected ? (
              <button
                type="button"
                onClick={() => void disconnectProvider(provider)}
                disabled={disconnectingProvider === provider}
                className="w-full rounded-lg border border-rose-500/30 bg-rose-500/10 py-2 text-xs font-bold text-rose-400 transition-colors hover:bg-rose-500/20"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void connectProvider(provider)}
                disabled={connectingProvider === provider}
                className="w-full rounded-lg bg-[#1ECEFA] py-2 text-xs font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Connect {meta.label}
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
        description="Streamlined 5-step flow with hybrid social + manual import."
        headerIcon={<Sparkles size={24} />}
      >
        <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6 overflow-x-hidden px-3 pb-20 sm:px-4 lg:px-0">
          {/* Progress + Step Navigator */}
          <div className="sticky top-0 z-30 rounded-2xl border border-white/5 bg-[#0d0d16]/95 p-4 backdrop-blur-md">
            {/* Header row */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                  <span className="text-sm font-semibold">{step}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {step === 1 && 'Persona Selection'}
                    {step === 2 && 'Import Hub'}
                    {step === 3 && 'AI Optimization'}
                    {step === 4 && 'Review & Finalize'}
                    {step === 5 && 'Publish & Share'}
                  </p>
                  <p className="text-xs text-slate-500">Step {step} of 5</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/portfolios')}
                className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                Save & Exit
              </button>
            </div>
            {/* Progress bar */}
            <div className="h-1 w-full rounded-full bg-white/5">
              <div
                className="h-1 rounded-full bg-purple-500 transition-all duration-700"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
            {/* Step pills */}
            <div
              className="mt-3 flex items-center gap-1.5 overflow-x-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {([
                { id: 1, label: 'Persona' },
                { id: 2, label: 'Import' },
                { id: 3, label: 'AI Optimize' },
                { id: 4, label: 'Review' },
                { id: 5, label: 'Publish' },
              ] as Array<{ id: Step; label: string }>).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (s.id <= step) setStep(s.id);
                  }}
                  disabled={s.id > step}
                  className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    step === s.id
                      ? 'bg-purple-500 text-white'
                      : s.id < step
                      ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                      : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {showDraftRestoration && pendingDraft && (
            <div className="relative overflow-hidden rounded-2xl border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 p-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1ECEFA]/20 text-[#1ECEFA]">
                  <Clock size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white">
                    Continue where you left off?
                  </h4>
                  <p className="text-sm text-slate-300">
                    We found an unfinished{' '}
                    {pendingDraft.type === 'ai' ? 'AI import' : 'local draft'}.
                    Restore it to save time!
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => void restoreDraft()}
                      className="rounded-lg bg-[#1ECEFA] px-4 py-2 text-xs font-black text-black"
                    >
                      Restore Draft
                    </button>
                    <button
                      onClick={() => {
                        setShowDraftRestoration(false);
                        setPendingDraft(null);
                      }}
                      className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-slate-400"
                    >
                      Start Fresh
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDraftRestoration(false);
                    setPendingDraft(null);
                  }}
                  className="text-slate-500 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
                <div className="mb-8 text-center">
                  <h2 className="font-display text-3xl font-black text-white">
                    Who are you building for?
                  </h2>
                  <p className="mt-2 text-slate-400">
                    Select a persona to optimize your portfolio structure and AI
                    suggestions.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {PERSONA_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPersona(option.value)}
                      className={`group relative flex flex-col items-center rounded-2xl border p-6 text-center transition-all duration-300 ${
                        persona === option.value
                          ? 'border-purple-500/40 bg-purple-500/10'
                          : 'border-white/5 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div
                        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300 ${
                          persona === option.value
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white'
                        }`}
                      >
                        <option.icon size={28} />
                      </div>
                      <h3 className="text-sm font-black text-white">
                        {option.label}
                      </h3>
                      <p className="mt-1 text-[10px] text-slate-500 leading-tight">
                        {option.desc}
                      </p>
                      {persona === option.value && (
                        <div className="absolute -top-2 -right-2 rounded-full bg-purple-500 p-1 text-white">
                          <Check size={12} strokeWidth={4} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-10 ">
                  <div className="flex flex-col  gap-3">
                    <div className=" flex  justify-between">
                      <button
                        onClick={() => {
                          setSetupMethod('manual');
                          setStep(2);
                        }}
                        className="rounded-xl border border-white/10 bg-white/5 py-3 px-6 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                      >
                        Skip to Manual Entry
                      </button>
                      <button
                        onClick={() => setStep(2)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#1ECEFA] py-3 px-6 text-sm font-semibold text-black hover:bg-white transition-colors"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="min-w-0 space-y-6">
                <div className="rounded-3xl border border-white/10  p-6 shadow-2xl">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <h2 className="font-display text-2xl font-black text-white">
                      Unified Import Hub
                    </h2>
                    <div className="flex items-center gap-1 rounded-2xl bg-[#0d0d16] p-1">
                      {(
                        ['profile', 'projects', 'certifications'] as ImportTab[]
                      ).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-all ${
                            activeTab === tab
                              ? 'bg-purple-500 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeTab === 'profile' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="flex items-center gap-4">
                        <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
                          {(['social', 'manual', 'hybrid'] as ImportMode[]).map(
                            (mode) => (
                              <button
                                key={mode}
                                onClick={() => setProfileMode(mode)}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                                  profileMode === mode
                                    ? 'bg-[#1ECEFA] text-black'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {mode}
                              </button>
                            ),
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold ">
                          Profile Sources
                        </p>
                      </div>

                      {modeHasSocial(profileMode) && (
                        <div className="grid gap-4">
                          {renderProviderCards(PROFILE_PROVIDER_IDS)}
                        </div>
                      )}

                      {modeHasManual(profileMode) && (
                        <div className="grid gap-4 md:grid-cols-2 rounded-2xl border border-white/5 bg-black/20 p-6">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black  text-slate-500 ml-1">
                              Full Name
                            </label>
                            <input
                              value={manualFullName}
                              onChange={(e) =>
                                setManualFullName(e.target.value)
                              }
                              placeholder="Taro Sakamoto"
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black  text-slate-500 ml-1">
                              Job Title
                            </label>
                            <input
                              value={manualProfessionalTitle}
                              onChange={(e) =>
                                setManualProfessionalTitle(e.target.value)
                              }
                              placeholder="Senior Designer"
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-black  text-slate-500 ml-1">
                              Professional Bio
                            </label>
                            <textarea
                              value={manualBio}
                              onChange={(e) => setManualBio(e.target.value)}
                              placeholder="Tell your story..."
                              rows={4}
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none resize-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 ml-1">
                              Skills (comma separated)
                            </label>
                            <input
                              value={manualSkills}
                              onChange={(e) => setManualSkills(e.target.value)}
                              placeholder="React, Figma, UX Research..."
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black  text-slate-500 ml-1">
                              Contact Email
                            </label>
                            <input
                              value={manualContactEmail}
                              onChange={(e) =>
                                setManualContactEmail(e.target.value)
                              }
                              placeholder="sakamoto@example.com"
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'projects' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="flex items-center gap-4">
                        <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
                          {(['social', 'manual', 'hybrid'] as ImportMode[]).map(
                            (mode) => (
                              <button
                                key={mode}
                                onClick={() => setProjectMode(mode)}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                                  projectMode === mode
                                    ? 'bg-[#1ECEFA] text-black'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {mode}
                              </button>
                            ),
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold ">
                          Project Sources
                        </p>
                      </div>

                      {modeHasSocial(projectMode) && (
                        <div className="grid gap-4 ">
                          {renderProviderCards(PROJECT_PROVIDER_IDS)}
                        </div>
                      )}

                      {modeHasManual(projectMode) && (
                        <div className="space-y-4">
                          {manualProjects.map((project, idx) => (
                            <div
                              key={project.id}
                              className="group relative rounded-2xl border border-white/5 bg-black/20 p-6 transition-all hover:border-white/10"
                            >
                              <div className="mb-4 flex items-center justify-between">
                                <h4 className="text-xs font-black  text-slate-400">
                                  Project #{idx + 1}
                                </h4>
                                <button
                                  onClick={() =>
                                    setManualProjects((prev) =>
                                      prev.filter((p) => p.id !== project.id),
                                    )
                                  }
                                  className="text-slate-600 hover:text-rose-400"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                              <div className="grid gap-4 md:grid-cols-2">
                                <input
                                  value={project.title}
                                  onChange={(e) =>
                                    setManualProjects((prev) =>
                                      prev.map((p) =>
                                        p.id === project.id
                                          ? { ...p, title: e.target.value }
                                          : p,
                                      ),
                                    )
                                  }
                                  placeholder="Project Title"
                                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none"
                                />
                                <input
                                  value={project.tools}
                                  onChange={(e) =>
                                    setManualProjects((prev) =>
                                      prev.map((p) =>
                                        p.id === project.id
                                          ? { ...p, tools: e.target.value }
                                          : p,
                                      ),
                                    )
                                  }
                                  placeholder="Tools (e.g. Next.js, Figma)"
                                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none"
                                />
                                <textarea
                                  value={project.description}
                                  onChange={(e) =>
                                    setManualProjects((prev) =>
                                      prev.map((p) =>
                                        p.id === project.id
                                          ? {
                                              ...p,
                                              description: e.target.value,
                                            }
                                          : p,
                                      ),
                                    )
                                  }
                                  placeholder="Short description of your impact..."
                                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none md:col-span-2 resize-none"
                                  rows={2}
                                />
                                <input
                                  value={project.link}
                                  onChange={(e) =>
                                    setManualProjects((prev) =>
                                      prev.map((p) =>
                                        p.id === project.id
                                          ? { ...p, link: e.target.value }
                                          : p,
                                      ),
                                    )
                                  }
                                  placeholder="Live Link or Repo URL"
                                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none"
                                />
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                      void handleProjectFileUpload(
                                        project.id,
                                        e,
                                      )
                                    }
                                    className="hidden"
                                    id={`file-${project.id}`}
                                  />
                                  <label
                                    htmlFor={`file-${project.id}`}
                                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/10 hover:text-white"
                                  >
                                    <Plus size={14} />{' '}
                                    {project.imageUrl
                                      ? 'Change Snapshot'
                                      : 'Upload Snapshot'}
                                  </label>
                                </div>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() =>
                              setManualProjects((prev) => [
                                ...prev,
                                DEFAULT_MANUAL_PROJECT(),
                              ])
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/5 py-4 text-sm font-bold text-slate-500 transition-all hover:bg-white/10 hover:text-[#1ECEFA]"
                          >
                            <PlusCircle size={18} /> Add Custom Project
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'certifications' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
                            {(
                              ['social', 'manual', 'hybrid'] as ImportMode[]
                            ).map((mode) => (
                              <button
                                key={mode}
                                onClick={() => setCertificationMode(mode)}
                                disabled={!certificationsEnabled}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                                  certificationMode === mode
                                    ? 'bg-[#1ECEFA] text-black'
                                    : 'text-slate-500 hover:text-slate-300'
                                } disabled:opacity-30`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            Certification Sources
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setCertificationsEnabled(!certificationsEnabled)
                          }
                          className={`text-[11px] font-bold px-4 py-2 transition-colors ${
                            certificationsEnabled 
                              ? 'text-rose-400'
                              : 'text-[#1ECEFA]'
                          }`}
                        >
                          {certificationsEnabled
                            ? 'Disable Section'
                            : 'Enable Section'}
                        </button>
                      </div>

                      {certificationsEnabled && (
                        <>
                          {modeHasSocial(certificationMode) && (
                            <div className="grid gap-4 ">
                              {renderProviderCards(CERT_PROVIDER_IDS)}
                            </div>
                          )}

                          {modeHasManual(certificationMode) && (
                            <div className="space-y-4">
                              {manualCertifications.map((cert, idx) => (
                                <div
                                  key={cert.id}
                                  className="group relative rounded-2xl border border-white/5 bg-black/20 p-6 transition-all hover:border-white/10"
                                >
                                  <div className="mb-4 flex items-center justify-between">
                                    <h4 className="text-xs font-black  text-slate-400">
                                      Certification #{idx + 1}
                                    </h4>
                                    <button
                                      onClick={() =>
                                        setManualCertifications((prev) =>
                                          prev.filter((p) => p.id !== cert.id),
                                        )
                                      }
                                      className="text-slate-600 hover:text-rose-400"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <input
                                      value={cert.title}
                                      onChange={(e) =>
                                        setManualCertifications((prev) =>
                                          prev.map((p) =>
                                            p.id === cert.id
                                              ? { ...p, title: e.target.value }
                                              : p,
                                          ),
                                        )
                                      }
                                      placeholder="Certificate Title"
                                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none"
                                    />
                                    <input
                                      value={cert.issuer}
                                      onChange={(e) =>
                                        setManualCertifications((prev) =>
                                          prev.map((p) =>
                                            p.id === cert.id
                                              ? { ...p, issuer: e.target.value }
                                              : p,
                                          ),
                                        )
                                      }
                                      placeholder="Issuer (e.g. Google, IBM)"
                                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none"
                                    />
                                    <input
                                      value={cert.date}
                                      onChange={(e) =>
                                        setManualCertifications((prev) =>
                                          prev.map((p) =>
                                            p.id === cert.id
                                              ? { ...p, date: e.target.value }
                                              : p,
                                          ),
                                        )
                                      }
                                      placeholder="Date (e.g. March 2024)"
                                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none"
                                    />
                                    <div className="relative">
                                      <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={(e) =>
                                          void handleCertificationProofUpload(
                                            cert.id,
                                            e,
                                          )
                                        }
                                        className="hidden"
                                        id={`cert-file-${cert.id}`}
                                      />
                                      <label
                                        htmlFor={`cert-file-${cert.id}`}
                                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/10 hover:text-white"
                                      >
                                        <Plus size={14} />{' '}
                                        {cert.proofName
                                          ? 'Change Proof'
                                          : 'Upload Proof (Image/PDF)'}
                                      </label>
                                    </div>
                                  </div>
                                  {cert.proofName && (
                                    <p className="mt-2 text-[10px] text-[#1ECEFA] font-bold">
                                      ✓ {cert.proofName} attached
                                    </p>
                                  )}
                                </div>
                              ))}
                              <button
                                onClick={() =>
                                  setManualCertifications((prev) => [
                                    ...prev,
                                    DEFAULT_MANUAL_CERTIFICATION(),
                                  ])
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/5 py-4 text-sm font-bold text-slate-500 transition-all hover:bg-white/10 hover:text-[#1ECEFA]"
                              >
                                <PlusCircle size={18} /> Add Local Certificate
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-6">
                    <button
                      onClick={() => setStep(1)}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-400 hover:bg-white/10 hover:text-white sm:px-6"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="w-full rounded-xl bg-[#1ECEFA] px-6 py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(30,206,250,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto sm:px-10"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar Preview */}
              <aside className="min-w-0 space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
                  <h3 className="mb-4 text-xs font-black  text-[#1ECEFA]">
                    Draft Overview
                  </h3>

                  <div className="space-y-4">
                    <div className="rounded-xl bg-black/40 p-4 border border-white/5">
                      <p className="text-xs font-bold text-white">
                        {manualFullName || user.name || 'Anonymous'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {manualProfessionalTitle || `${persona} Portfolio`}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {manualSkillList.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="rounded bg-white/5 px-1.5 py-0.5 text-[8px] text-slate-400 border border-white/5"
                          >
                            {skill}
                          </span>
                        ))}
                        {manualSkillList.length > 5 && (
                          <span className="text-[8px] text-slate-600">
                            +{manualSkillList.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-black  text-slate-500">
                        Live Snapshot
                      </p>
                      <div className="rounded-xl bg-black/20 p-3 border border-white/5">
                        <div className="flex justify-between text-[10px] mb-2">
                          <span className="text-slate-400">Projects</span>
                          <span className="text-white font-bold">
                            {normalizedManualProjects.length}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] mb-2">
                          <span className="text-slate-400">Certs</span>
                          <span className="text-white font-bold">
                            {normalizedManualCertifications.length}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400">Social Linked</span>
                          <span className="text-[#1ECEFA] font-bold">
                            {selectedProviders.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-[#1ECEFA]/20 to-transparent p-4 border border-[#1ECEFA]/20">
                      <p className="text-[10px] font-black  text-[#1ECEFA]">
                        Auto-fill Confidence
                      </p>
                      <div className="mt-2 flex items-end gap-2">
                        <span className="text-3xl font-black text-white">
                          {autoFillEstimate}%
                        </span>
                        <span className="text-[10px] text-slate-400 mb-1">
                          Target: 80%+
                        </span>
                      </div>
                      <div className="mt-2 h-1 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-[#1ECEFA]"
                          style={{ width: `${autoFillEstimate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Bot className="text-[#1ECEFA]" size={16} />
                    <p className="text-[10px] font-black  text-slate-300">
                      Quick Fill
                    </p>
                  </div>
                  <input
                    value={quickFillUrl}
                    onChange={(e) => setQuickFillUrl(e.target.value)}
                    placeholder="Paste GitHub/Behance URL..."
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[10px] text-white focus:outline-none focus:border-[#1ECEFA]/30"
                  />
                  <button
                    onClick={() => {
                      const url = quickFillUrl.toLowerCase();
                      if (
                        url.includes('github') ||
                        url.includes('behance') ||
                        url.includes('figma')
                      ) {
                        setActiveTab('projects');
                        setProjectMode('hybrid');
                        setStatusNote(
                          `Detected ${url.includes('github') ? 'GitHub' : url.includes('behance') ? 'Behance' : 'Figma'} link. Mode set to Hybrid.`,
                        );
                      } else if (
                        url.includes('udemy') ||
                        url.includes('coursera')
                      ) {
                        setActiveTab('certifications');
                        setCertificationsEnabled(true);
                        setCertificationMode('hybrid');
                        setStatusNote(
                          `Detected ${url.includes('udemy') ? 'Udemy' : 'Coursera'} link. Mode set to Hybrid.`,
                        );
                      } else {
                        setStatusNote('Analyzing URL for data extraction...');
                      }
                      setQuickFillUrl('');
                    }}
                    className="mt-2 w-full rounded-lg bg-white/10 py-2 text-[10px] font-bold text-white hover:bg-white/20"
                  >
                    Analyze Link
                  </button>
                </div>
              </aside>
            </div>
          )}

          {step === 3 && (
            <div className="grid min-w-0 gap-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl sm:p-8">
                <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
                  <div>
                    <h2 className="font-display text-3xl font-black text-white">
                      AI Optimization & Customization
                    </h2>
                    <p className="mt-1 text-slate-400">
                      Interactive refinement of your portfolio before we build
                      the draft.
                    </p>
                  </div>
                  <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-2 rounded-lg transition-all ${previewDevice === 'desktop' ? 'bg-[#1ECEFA] text-black' : 'text-slate-500'}`}
                    >
                      <LayoutDashboard size={20} />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-2 rounded-lg transition-all ${previewDevice === 'mobile' ? 'bg-[#1ECEFA] text-black' : 'text-slate-500'}`}
                    >
                      <SidebarRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
                  <div className="min-w-0 space-y-6">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black  text-[#1ECEFA]">
                        AI Refinement Carousel
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {aiSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() =>
                              setStatusNote(`Applied: ${suggestion}`)
                            }
                            className="flex min-w-0 flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-[#1ECEFA]/50 hover:bg-[#1ECEFA]/5"
                          >
                            <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-[#1ECEFA]/10 text-[#1ECEFA]">
                              <Sparkles size={16} />
                            </div>
                            <p className="text-sm font-bold text-white leading-relaxed">
                              {suggestion}
                            </p>
                            <p className="mt-4 text-[10px] font-black  text-[#1ECEFA]">
                              Apply Optimization
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-black/40 p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <Bot className="text-[#1ECEFA]" size={24} />
                        <h4 className="text-sm font-black text-white">
                          Draft Critique & Health Score
                        </h4>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                              SEO Score
                            </span>
                            <span className="text-xs font-bold text-emerald-400">
                              88/100
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full bg-emerald-400"
                              style={{ width: '88%' }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                              Content Density
                            </span>
                            <span className="text-xs font-bold text-[#1ECEFA]">
                              72/100
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full bg-[#1ECEFA]"
                              style={{ width: '72%' }}
                            />
                          </div>
                        </div>
                        <div className="rounded-xl bg-white/5 p-4 border border-white/5">
                          <p className="text-[10px] font-black  text-slate-500 mb-2">
                            AI Observation
                          </p>
                          <p className="text-xs text-slate-300 leading-relaxed italic">
                            "Your project descriptions are strong, but consider
                            adding more numerical outcomes (e.g. 'Increased
                            speed by 40%') to appeal to {persona} requirements."
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative min-w-0">
                    <div
                      className={`mx-auto rounded-[2rem] border-[8px] border-slate-800 bg-white shadow-2xl transition-all duration-500 overflow-hidden ${
                        previewDevice === 'mobile'
                          ? 'max-w-[280px] aspect-[9/19]'
                          : 'w-full aspect-video'
                      }`}
                    >
                      <div className="h-full w-full overflow-y-auto bg-slate-50 p-6 scrollbar-hide">
                        <div className="mb-6 flex items-center justify-between">
                          <div className="h-4 w-12 rounded bg-slate-200" />
                          <div className="flex gap-2">
                            <div className="h-4 w-4 rounded-full bg-slate-200" />
                            <div className="h-4 w-4 rounded-full bg-slate-200" />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="h-8 w-3/4 rounded-lg bg-slate-900" />
                          <div className="h-4 w-1/2 rounded-lg bg-[#1ECEFA]" />
                          <div className="space-y-2 py-4">
                            <div className="h-3 w-full rounded bg-slate-200" />
                            <div className="h-3 w-full rounded bg-slate-200" />
                            <div className="h-3 w-2/3 rounded bg-slate-200" />
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-4">
                            <div className="aspect-square rounded-xl bg-slate-100" />
                            <div className="aspect-square rounded-xl bg-slate-100" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[#1ECEFA] px-4 py-1 text-[8px] font-black  text-black shadow-lg">
                      Live Interactive Draft
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-8">
                  <button
                    onClick={() => setStep(2)}
                    className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold text-slate-400 hover:bg-white/10 hover:text-white sm:px-8"
                  >
                    Refine Data
                  </button>
                  <div className="flex w-full flex-wrap gap-3 sm:w-auto sm:justify-end sm:gap-4">
                    <button
                      onClick={() =>
                        setStatusNote('Regenerating AI Variations...')
                      }
                      className="flex-1 rounded-xl border border-[#1ECEFA]/30 bg-[#1ECEFA]/5 px-6 py-4 text-sm font-bold text-[#1ECEFA] hover:bg-[#1ECEFA]/10 sm:flex-none sm:px-8"
                    >
                      Regenerate Variations
                    </button>
                    <button
                      onClick={() => void startImport()}
                      disabled={startingImport}
                      className="flex flex-1 items-center justify-center gap-3 rounded-xl bg-[#1ECEFA] px-6 py-4 text-sm font-black text-black shadow-[0_0_30px_rgba(30,206,250,0.4)] transition-all hover:scale-[1.05] active:scale-[0.95] sm:flex-none sm:px-12"
                    >
                      {startingImport
                        ? 'Processing...'
                        : 'Generate My Portfolio'}{' '}
                      <Zap size={20} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid min-w-0 gap-6 animate-in fade-in duration-500">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl sm:p-8">
                <div className="mb-8 text-center">
                  <h2 className="font-display text-3xl font-black text-white">
                    Review & Finalize
                  </h2>
                  <p className="mt-2 text-slate-400">
                    Your AI-optimized draft is ready for a quick final check.
                  </p>
                </div>

                {status?.status === 'queued' || status?.status === 'running' ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-6">
                    <div className="relative">
                      <div className="absolute inset-0 animate-ping rounded-full bg-[#1ECEFA]/20" />
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#1ECEFA]/10 text-[#1ECEFA] border border-[#1ECEFA]/30">
                        <Bot size={48} />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">
                        AI is weaving your story...
                      </p>
                      <p className="mt-1 text-slate-400">
                        Structuring projects, refining bio, and optimizing for
                        search.
                      </p>
                    </div>
                    <div className="w-full max-w-md space-y-2">
                      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#1ECEFA] to-[#0A4F78] transition-all duration-1000"
                          style={{ width: `${status.progressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-black  text-slate-500">
                        <span>Progress</span>
                        <span>{status.progressPct}%</span>
                      </div>
                    </div>
                  </div>
                ) : status?.status === 'failed' ? (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
                    <p className="text-lg font-bold text-rose-400 mb-4">
                      {status.message || 'Optimization failed'}
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                      <button
                        onClick={() => setStep(3)}
                        className="rounded-xl border border-white/10 px-6 py-3 text-sm font-bold text-white"
                      >
                        Back to AI Step
                      </button>
                      <button
                        onClick={() => void startImport()}
                        className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white"
                      >
                        Retry AI Process
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="grid gap-6 md:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <p className="text-[10px] font-black  text-[#1ECEFA] mb-2">
                          ATS Compatibility
                        </p>
                        <div className="flex items-end gap-2">
                          <span className="text-4xl font-black text-white">
                            {autoFillEstimate}%
                          </span>
                          <span className="text-xs text-emerald-400 mb-1">
                            Excellent
                          </span>
                        </div>
                        <p className="mt-4 text-xs text-slate-400 leading-relaxed">
                          Keywords mapped successfully from your LinkedIn and
                          GitHub projects.
                        </p>
                      </div>
                      <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6">
                        <p className="text-[10px] font-black  text-slate-500 mb-4">
                          Summary Checklist
                        </p>
                        <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                              <Check size={12} strokeWidth={4} />
                            </div>
                            <span className="text-sm text-slate-300">
                              Profile Information
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                              <Check size={12} strokeWidth={4} />
                            </div>
                            <span className="text-sm text-slate-300">
                              {normalizedManualProjects.length +
                                (importProviders.includes('github')
                                  ? 6
                                  : 0)}{' '}
                              Projects Linked
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                              <Check size={12} strokeWidth={4} />
                            </div>
                            <span className="text-sm text-slate-300">
                              {manualSkillList.length} Core Skills
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full ${certificationsEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-600'}`}
                            >
                              <Check size={12} strokeWidth={4} />
                            </div>
                            <span className="text-sm text-slate-300">
                              {certificationsEnabled
                                ? 'Certs Included'
                                : 'Certs Skipped'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-black/40 p-6">
                      <h4 className="text-xs font-black  text-slate-500 mb-4">
                        Conflict Resolution
                      </h4>
                      {conflicts.length === 0 ? (
                        <div className="flex items-center gap-3 text-emerald-400">
                          <CheckCircle size={20} />
                          <p className="text-sm font-bold">
                            No data conflicts found. Data merging was seamless.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {conflicts.map((conflict) => (
                            <div
                              key={conflict.field}
                              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/5 p-4"
                            >
                              <div>
                                <p className="text-[10px] font-black  text-[#1ECEFA]">
                                  {conflict.field}
                                </p>
                                <p className="text-xs text-slate-400">
                                  Suggesting value from{' '}
                                  {conflict.recommendedProvider}
                                </p>
                              </div>
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
                                className="w-full min-w-0 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none sm:min-w-[200px] sm:flex-1"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-between items-center gap-6 border-t border-white/5 pt-8">
                      <div className="flex flex-wrap gap-4">
                        <button
                          onClick={() => setStep(3)}
                          className="rounded-xl border border-white/10 px-6 py-3 text-sm font-bold text-slate-400 hover:bg-white/10 hover:text-white"
                        >
                          Refine AI
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="rounded-xl border border-white/10 px-6 py-3 text-sm font-bold text-slate-400 hover:bg-white/10 hover:text-white flex items-center gap-2"
                        >
                          <Download size={16} /> PDF Preview
                        </button>
                      </div>
                      <button
                        onClick={() => void confirmImport()}
                        disabled={confirming}
                        className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#1ECEFA] px-6 py-4 text-sm font-black text-black shadow-[0_0_30px_rgba(30,206,250,0.3)] transition-all hover:scale-[1.05] active:scale-[0.95] sm:w-auto sm:px-12"
                      >
                        {confirming ? 'Finalizing...' : 'Finalize & Build'}{' '}
                        <CheckCircle size={20} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="grid min-w-0 gap-6 animate-in fade-in zoom-in-95 duration-700">
              <div className="rounded-3xl border border-[#1ECEFA]/30 bg-[#1ECEFA]/5 p-5 text-center shadow-[0_0_50px_rgba(30,206,250,0.1)] sm:p-10">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#1ECEFA] text-black shadow-[0_0_30px_rgba(30,206,250,0.5)]">
                  <Sparkles size={48} />
                </div>
                <h2 className="font-display text-4xl font-black text-white">
                  Ready for the World!
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-slate-400">
                  Your portfolio is built and ready to launch. Choose your link
                  and set your visibility.
                </p>

                <div className="mx-auto mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
                  <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-6 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black  text-slate-500">
                        Your Personal Link
                      </label>
                      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1 pl-4">
                        <span className="shrink-0 text-xs text-slate-500">
                          blox.app/
                        </span>
                        <input
                          value={publishSubdomain}
                          onChange={(e) =>
                            setPublishSubdomain(slugify(e.target.value))
                          }
                          className="min-w-0 flex-1 bg-transparent py-2 text-sm font-bold text-white focus:outline-none"
                          placeholder="username"
                        />
                      </div>
                      {subdomainSuggestions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {subdomainSuggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() => setPublishSubdomain(s)}
                              className="rounded-lg bg-white/5 px-2 py-1 text-[10px] text-slate-400 hover:text-white"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black  text-slate-500">
                        Visibility
                      </label>
                      <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
                        {(['PUBLIC', 'UNLISTED', 'PRIVATE'] as const).map(
                          (v) => (
                            <button
                              key={v}
                              onClick={() => setPublishVisibility(v)}
                              className={`flex-1 rounded-lg py-2 text-[10px] font-black  transition-all ${
                                publishVisibility === v
                                  ? 'bg-[#1ECEFA] text-black'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {v}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-4">
                    <button
                      onClick={() => void publishDraft()}
                      disabled={publishing || !status?.draftAssetId}
                      className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#1ECEFA] to-[#0A4F78] text-lg font-black text-white shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      {publishing ? 'Publishing...' : 'Launch Site Now'}{' '}
                      <ArrowUpRight size={24} strokeWidth={3} />
                    </button>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/portfolios/${status?.draftAssetId}/edit`,
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-4 text-xs font-bold text-white hover:bg-white/10"
                      >
                        Open Advanced Editor
                      </button>
                      <button
                        onClick={() => router.push('/portfolios')}
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-4 text-xs font-bold text-white hover:bg-white/10"
                      >
                        Back to Dashboard
                      </button>
                    </div>
                  </div>
                </div>

                {publishedUrl && (
                  <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 animate-in fade-in zoom-in duration-500">
                    <h4 className="text-xl font-black text-white">
                      Congratulations! 🎉
                    </h4>
                    <p className="mt-2 text-sm text-emerald-100">
                      Your portfolio is live and looking stunning.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      <button
                        onClick={() => window.open(publishedUrl, '_blank')}
                        className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-black text-black"
                      >
                        <ExternalLink size={16} /> View Live Site
                      </button>
                      <button
                        onClick={() => void copyPublishedLink()}
                        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-xs font-black text-white"
                      >
                        <Globe size={16} /> Copy Link
                      </button>
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publishedUrl)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-xl bg-[#0A66C2] px-6 py-3 text-xs font-black text-white"
                      >
                        <Linkedin size={16} /> Share on LinkedIn
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {statusError && (
            <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl rounded-2xl border border-rose-500/30 bg-rose-500/20 px-4 py-3 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:bottom-8 sm:left-1/2 sm:right-auto sm:w-[min(92vw,42rem)] sm:-translate-x-1/2 sm:px-6 sm:py-4">
              <div className="flex flex-wrap items-center gap-3 text-rose-400">
                <X
                  size={20}
                  strokeWidth={3}
                  className="cursor-pointer"
                  onClick={() => setStatusError('')}
                />
                <p className="break-words text-sm font-bold">{statusError}</p>
              </div>
            </div>
          )}

          {statusNote && !statusError && (
            <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl rounded-2xl border border-[#1ECEFA]/30 bg-[#1ECEFA]/20 px-4 py-3 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:bottom-8 sm:left-1/2 sm:right-auto sm:w-[min(92vw,42rem)] sm:-translate-x-1/2 sm:px-6 sm:py-4">
              <div className="flex flex-wrap items-center gap-3 text-[#1ECEFA]">
                <Sparkles size={20} />
                <p className="break-words text-sm font-bold">{statusNote}</p>
                <X
                  size={16}
                  className="ml-4 cursor-pointer text-slate-400"
                  onClick={() => setStatusNote('')}
                />
              </div>
            </div>
          )}
        </div>
      </FeaturePage>
    </AuthGuard>
  );
}
    
