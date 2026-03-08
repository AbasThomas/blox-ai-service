import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { normalizePortfolioTemplateId } from '@/lib/portfolio-templates';
import { ArcadeTemplate } from './ArcadeTemplate';
import { GardenStudioTemplate } from './GardenStudioTemplate';
import { BentoStudioTemplate } from './BentoStudioTemplate';
import { CanvasDesignerTemplate } from './CanvasDesignerTemplate';
import { DevTerminalTemplate } from './DevTerminalTemplate';
import { FreelanceTemplate } from './FreelanceTemplate';
import { GlassDevTemplate } from './GlassDevTemplate';
import { MinimalTemplate } from './MinimalTemplate';
import { NeonDevTemplate } from './NeonDevTemplate';
import { NightfallTemplate } from './NightfallTemplate';
import { ShowcaseTemplate } from './ShowcaseTemplate';
import { StudioDesignerTemplate } from './StudioDesignerTemplate';

interface PortfolioTemplateRendererProps {
  profile?: PublicProfilePayload | null;
  subdomain: string;
  templateId?: string;
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asSectionText(value: unknown): string {
  const plain = asText(value);
  if (plain) return plain;

  const row = asRecord(value);
  return (
    asText(row.body) ||
    asText(row.content) ||
    asText(row.summary) ||
    asText(row.description) ||
    asText(row.ctaMessage) ||
    asText(row.message) ||
    [asText(row.email), asText(row.phone)].filter(Boolean).join(' · ')
  );
}

function asSkillLabel(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    return (
      asText(row.name) ||
      asText(row.label) ||
      asText(row.title) ||
      asText(row.skill) ||
      ''
    );
  }
  return '';
}

function normalizeProfile(
  profile: PublicProfilePayload | null | undefined,
  subdomain: string,
): PublicProfilePayload {
  const safeSubdomain = (profile?.subdomain || subdomain || 'portfolio').trim() || 'portfolio';
  const rawProfile = asRecord(profile);
  const basic = asRecord(rawProfile.basic);
  const socials = asRecord(rawProfile.socials);
  const sections = profile?.sections;
  const user = profile?.user;
  const fullName = user?.fullName?.trim() || asText(basic.name) || 'Portfolio Owner';
  const headline = user?.headline?.trim() || asText(basic.tagline) || undefined;
  const normalizedSkills = Array.isArray(sections?.skills)
    ? sections.skills
        .map((skill) => asSkillLabel(skill))
        .filter(Boolean)
    : [];
  const aboutText = asSectionText(sections?.about) || asSectionText(basic.about);
  const heroHeading = asText(sections?.hero?.heading) || fullName;
  const heroBody = asSectionText(sections?.hero?.body) || aboutText;
  const contactText = asSectionText(sections?.contact);
  const normalizedLinks = Array.isArray(sections?.links)
    ? sections.links
    : Object.entries(socials)
        .map(([label, value]) => {
          const url = asText(value);
          if (!url) return null;
          return { label, url, kind: 'other' as const };
        })
        .filter((item): item is { label: string; url: string; kind: 'other' } => !!item);

  return {
    subdomain: safeSubdomain,
    templateId: profile?.templateId,
    ...(profile?.sectionOrder ? { sectionOrder: profile.sectionOrder } : {}),
    canonicalUrl: profile?.canonicalUrl || `https://${safeSubdomain}.blox.app`,
    user: {
      fullName,
      ...(user?.emailInitials ? { emailInitials: user.emailInitials } : {}),
      ...(headline ? { headline } : {}),
      ...(user?.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    },
    seo: {
      title: profile?.seo?.title || `${fullName} | Portfolio`,
      description: profile?.seo?.description || 'Portfolio profile',
      keywords: Array.isArray(profile?.seo?.keywords)
        ? profile.seo.keywords.map((keyword) => asText(keyword)).filter(Boolean)
        : [],
      ogImageUrl: profile?.seo?.ogImageUrl || '',
      noindex: Boolean(profile?.seo?.noindex),
      structuredData: profile?.seo?.structuredData ?? true,
      imageAltMap: profile?.seo?.imageAltMap ?? {},
    },
    sections: {
      hero: {
        heading: heroHeading,
        body: heroBody,
      },
      about: aboutText,
      experience: Array.isArray(sections?.experience) ? sections.experience : [],
      projects: Array.isArray(sections?.projects) ? sections.projects : [],
      certifications: Array.isArray(sections?.certifications) ? sections.certifications : [],
      skills: normalizedSkills,
      links: normalizedLinks,
      contact: contactText,
    },
    updatedAt: profile?.updatedAt || new Date().toISOString(),
  };
}

export function PortfolioTemplateRenderer({
  profile,
  subdomain,
  templateId,
}: PortfolioTemplateRendererProps) {
  const safeProfile = normalizeProfile(profile, subdomain);
  const activeTemplateId = normalizePortfolioTemplateId(templateId ?? safeProfile.templateId);

  switch (activeTemplateId) {
    case 'portfolio-neon-dev':
      return <NeonDevTemplate profile={safeProfile} subdomain={subdomain} />;
    case 'portfolio-glass-dev':
      return <GlassDevTemplate profile={safeProfile} subdomain={subdomain} />;
    case 'portfolio-studio-designer':
      return <StudioDesignerTemplate profile={safeProfile} subdomain={subdomain} />;
    case 'portfolio-canvas-designer':
      return <CanvasDesignerTemplate profile={safeProfile} subdomain={subdomain} />;
    case 'portfolio-garden-studio':
      return <GardenStudioTemplate profile={safeProfile} subdomain={subdomain} />;
    case 'portfolio-arcade':
      return <ArcadeTemplate profile={safeProfile} subdomain={subdomain} />;
    case 'portfolio-bento-studio':
      return <BentoStudioTemplate profile={safeProfile} subdomain={subdomain} />;
    case 'portfolio-freelance-conversion':
      return <FreelanceTemplate profile={safeProfile} subdomain={subdomain} />;
    case 'portfolio-timeline-dev':
      return <DevTerminalTemplate profile={safeProfile} subdomain={subdomain} />;
    case 'portfolio-minimal-clean':
      return <MinimalTemplate profile={safeProfile} subdomain={subdomain} />;
    case 'portfolio-grid-showcase':
      return <ShowcaseTemplate profile={safeProfile} subdomain={subdomain} />;
    case 'portfolio-modern-001':
    default:
      return <NightfallTemplate profile={safeProfile} subdomain={subdomain} />;
  }
}
