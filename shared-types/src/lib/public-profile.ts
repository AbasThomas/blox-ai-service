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
}

export interface PublicProfileSections {
  hero: {
    heading: string;
    body: string;
  };
  about: string;
  experience: PublicProfileExperienceItem[];
  projects: PublicProfileProjectItem[];
  skills: string[];
  links: SmartLink[];
  contact: string;
}

export interface PublicProfilePayload {
  subdomain: string;
  canonicalUrl: string;
  user: {
    fullName: string;
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
