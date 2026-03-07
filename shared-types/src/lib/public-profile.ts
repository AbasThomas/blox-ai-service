export type SmartLinkKind = 'primary' | 'social' | 'project' | 'contact' | 'other';

export interface SmartLink {
  label: string;
  url: string;
  kind?: SmartLinkKind;
  icon?: string;
}

export interface PublicProfileSeoConfig {
  title: string;
  description: string;
  keywords: string[];
  ogImageUrl: string;
  noindex: boolean;
  structuredData?: boolean;
  imageAltMap?: Record<string, string>;
}

export interface PublicProfileExperienceItem {
  role: string;
  summary?: string;
  company?: string;
  period?: string;
}

export interface PublicProfileProjectItem {
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  snapshotUrl?: string;
  images?: Array<{
    url: string;
    alt?: string;
  }>;
  tags?: string[];
  caseStudy?: string;
}

export interface PublicProfileCertificationItem {
  title: string;
  issuer?: string;
  date?: string;
  imageUrl?: string;
}

export interface PublicProfileSections {
  hero: {
    heading: string;
    body: string;
  };
  about: string;
  experience: PublicProfileExperienceItem[];
  projects: PublicProfileProjectItem[];
  certifications: PublicProfileCertificationItem[];
  skills: string[];
  links: SmartLink[];
  contact: string;
}

export interface PublicProfilePayload {
  subdomain: string;
  templateId?: string;
  sectionOrder?: string[];
  canonicalUrl: string;
  user: {
    fullName: string;
    emailInitials?: string;
    headline?: string;
    avatarUrl?: string;
  };
  seo: PublicProfileSeoConfig;
  sections: PublicProfileSections;
  updatedAt: string;
}

export interface SeoSuggestionPayload {
  title: string;
  description: string;
  keywords: string[];
  ogImagePrompt: string;
  imageAltMap: Record<string, string>;
}
