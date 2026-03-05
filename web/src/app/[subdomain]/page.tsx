import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { fetchPublicProfile } from '@/lib/public-profile';
import { normalizePortfolioTemplateId } from '@/lib/portfolio-templates';
import { isReservedSubdomain } from '@/lib/subdomains';
import { PortfolioTemplateRenderer } from '@/components/portfolio/templates/PortfolioTemplateRenderer';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'https://blox.app';

interface SubdomainPageProps {
  params: { subdomain?: string } | Promise<{ subdomain?: string }>;
}

function normalizeSubdomain(value: string | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function absoluteUrl(url: string): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('mailto:') || url.startsWith('tel:')) return url;
  return null;
}

function resolveOgImage(
  ogImageUrl: string | undefined | null,
  title: string,
  subtitle?: string,
  domain?: string,
): string {
  if (ogImageUrl && (ogImageUrl.startsWith('http://') || ogImageUrl.startsWith('https://'))) {
    return ogImageUrl;
  }
  const params = new URLSearchParams({ title });
  if (subtitle) params.set('subtitle', subtitle);
  if (domain) params.set('domain', domain);
  return `${BASE_URL}/og?${params.toString()}`;
}

// Map template ID → accent color for favicon
const TEMPLATE_ACCENTS: Record<string, { color: string; bg: string }> = {
  'portfolio-modern-001': { color: '#1ECEFA', bg: '#080B12' },
  'portfolio-freelance-conversion': { color: '#F59E0B', bg: '#1C1917' },
  'portfolio-timeline-dev': { color: '#22C55E', bg: '#0D1117' },
  'portfolio-minimal-clean': { color: '#6366F1', bg: '#FFFFFF' },
  'portfolio-grid-showcase': { color: '#FBBF24', bg: '#4A0916' },
};

function initialsFromEmail(email: string | undefined, fallbackName: string) {
  const local = (email ?? '').split('@')[0]?.replace(/[^a-z0-9]/gi, '') ?? '';
  if (local.length >= 2) return local.slice(0, 2).toLowerCase();
  if (local.length === 1) return `${local.toLowerCase()}${local.toLowerCase()}`;

  const fallback = fallbackName
    .split(' ')
    .map((token) => token[0] ?? '')
    .join('')
    .slice(0, 2)
    .toLowerCase();
  if (fallback.length === 2) return fallback;
  return 'bx';
}

export async function generateMetadata({ params }: SubdomainPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const subdomain = normalizeSubdomain(resolvedParams?.subdomain);
  if (!subdomain || isReservedSubdomain(subdomain)) {
    return { robots: { index: false, follow: false } };
  }

  const profile = await fetchPublicProfile(subdomain);
  if (!profile) {
    return {
      title: 'Profile Not Found',
      description: 'This profile does not exist.',
      robots: { index: false, follow: false },
    };
  }

  const templateId = normalizePortfolioTemplateId(profile.templateId);
  const accent = TEMPLATE_ACCENTS[templateId] ?? TEMPLATE_ACCENTS['portfolio-modern-001'];
  const initials = initialsFromEmail(profile.user.email, profile.user.fullName);

  const subdomainDomain = `${subdomain}.${BASE_URL.replace(/^https?:\/\//, '')}`;
  const canonical = profile.canonicalUrl ?? `https://${subdomainDomain}`;
  const heroRole = profile.sections.experience?.[0]?.role;
  const ogSubtitle = heroRole ?? profile.sections.hero.body?.slice(0, 60) ?? undefined;
  const ogImage = resolveOgImage(profile.seo.ogImageUrl, profile.seo.title, ogSubtitle, subdomainDomain);

  const faviconUrl = `/api/favicon?i=${encodeURIComponent(initials)}&c=${encodeURIComponent(accent.color)}&bg=${encodeURIComponent(accent.bg)}`;

  return {
    title: profile.seo.title,
    description: profile.seo.description,
    keywords: profile.seo.keywords,
    alternates: { canonical },
    icons: { icon: faviconUrl, shortcut: faviconUrl },
    robots: profile.seo.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: {
      title: profile.seo.title,
      description: profile.seo.description,
      url: canonical,
      type: 'profile',
      images: [{ url: ogImage, width: 1200, height: 630, alt: profile.seo.imageAltMap?.hero ?? `${profile.user.fullName} - portfolio cover` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: profile.seo.title,
      description: profile.seo.description,
      images: [ogImage],
    },
  };
}

export default async function SubdomainProfilePage({ params }: SubdomainPageProps) {
  const resolvedParams = await params;
  const subdomain = normalizeSubdomain(resolvedParams?.subdomain);
  if (!subdomain || isReservedSubdomain(subdomain)) notFound();

  const profile = await fetchPublicProfile(subdomain);
  if (!profile) notFound();

  const domain = `${subdomain}.${BASE_URL.replace(/^https?:\/\//, '')}`;
  const canonical = profile.canonicalUrl ?? `https://${domain}`;
  const jobTitle = profile.sections.experience?.[0]?.role ?? undefined;
  const ogSubtitle = jobTitle ?? profile.sections.hero.body?.slice(0, 60) ?? undefined;
  const ogImage = resolveOgImage(profile.seo.ogImageUrl, profile.seo.title, ogSubtitle, domain);

  const sameAsLinks = profile.sections.links
    .map((link) => absoluteUrl(link.url))
    .filter((url): url is string => !!url && url.startsWith('http'));

  const profileJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: canonical,
    dateModified: profile.updatedAt,
    mainEntity: {
      '@type': 'Person',
      name: profile.user.fullName,
      ...(jobTitle ? { jobTitle } : {}),
      description: profile.sections.about || profile.sections.hero.body,
      url: canonical,
      image: { '@type': 'ImageObject', url: ogImage, width: 1200, height: 630 },
      sameAs: sameAsLinks,
    },
  };

  const projectsJsonLd =
    profile.sections.projects.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `${profile.user.fullName} - Projects`,
          url: canonical,
          itemListElement: profile.sections.projects.map((project, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'CreativeWork',
              name: project.title,
              ...(project.description ? { description: project.description } : {}),
              ...(project.url ? { url: project.url } : {}),
              author: { '@type': 'Person', name: profile.user.fullName, url: canonical },
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />
      {projectsJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(projectsJsonLd) }}
        />
      ) : null}
      <PortfolioTemplateRenderer profile={profile} subdomain={subdomain} />
    </>
  );
}
