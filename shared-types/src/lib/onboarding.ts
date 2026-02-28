import { Persona } from './enums';

export type ImportProvider =
  | 'linkedin'
  | 'github'
  | 'upwork'
  | 'fiverr'
  | 'behance'
  | 'dribbble'
  | 'figma'
  | 'coursera';

export interface ProviderImportPayload {
  provider: ImportProvider;
  mode: 'live' | 'fallback' | 'skipped';
  connected: boolean;
  profile?: {
    name?: string;
    headline?: string;
    summary?: string;
    profileImageUrl?: string;
    publicUrl?: string;
    title?: string;
    hourlyRate?: number;
    location?: string;
  };
  skills?: string[];
  projects?: Array<{
    name: string;
    description?: string;
    url?: string;
    stars?: number;
    forks?: number;
    language?: string;
    screenshotUrl?: string;
  }>;
  links?: Record<string, string>;
}

export interface ImportConflict {
  field: 'name' | 'headline' | 'bio' | 'primaryTitle' | 'profileImageUrl';
  recommendedProvider: ImportProvider;
  recommendedValue: string;
  candidates: Array<{
    provider: ImportProvider;
    value: string;
  }>;
}

export interface MergedProfileDraft {
  name: string;
  headline: string;
  whatTheyDo: string;
  about: string;
  bio?: string;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    url?: string;
    source: ImportProvider;
  }>;
  profileImageUrl?: string;
  faviconUrl?: string;
  links: Record<string, string>;
  seoKeywords: string[];
  conflicts: ImportConflict[];
}

export interface StartOnboardingImportPayload {
  persona: Persona | string;
  providers: ImportProvider[];
  personalSiteUrl?: string;
  locationHint?: string;
  manualFallback?: Record<string, unknown>;
}

export interface ImportJobStatusResponse {
  runId: string;
  queueJobId?: string;
  status: 'queued' | 'running' | 'awaiting_review' | 'completed' | 'failed' | 'partial';
  progressPct: number;
  startedAt?: string;
  completedAt?: string;
  draftAssetId?: string;
  message?: string;
}
