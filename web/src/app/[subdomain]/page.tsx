import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublicProfile } from '@/lib/public-profile';
import { normalizePortfolioTemplateId } from '@/lib/portfolio-templates';
import { isReservedSubdomain } from '@/lib/subdomains';
import { PortfolioTemplateRenderer } from '@/components/portfolio/templates/PortfolioTemplateRenderer';
import { PortfolioViewTracker } from '@/components/analytics/PortfolioViewTracker';

// ISR: revalidate every 60 s — balances freshness with server load.
// Remove force-dynamic so pages can be ISR-cached globally.
export const revalidate = 60;

const BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'https://blox.app';
const ROOT_DOMAIN = (BASE_URL.replace(/^https?:\/\//, '')).replace(/\/$/, '');

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

/** Build a keyword-enriched description for SEO */
function buildSeoDescription(
  profile: Awaited<ReturnType<typeof fetchPublicProfile>>,
  subdomain: string,
): string {
  if (!profile) return '';
  const name = profile.user.fullName;
  const role = profile.sections.experience?.[0]?.role;
  const about = profile.sections.about || profile.sections.hero.body || '';
  const skills = profile.sections.skills.slice(0, 5).join(', ');

  let desc = profile.seo.description || '';
  if (desc && desc.length >= 80) return desc;

  // Auto-generate: "Alex Morgan | Senior Engineer portfolio — React, Node.js, AWS"
  const parts: string[] = [name];
  if (role) parts.push(role);
  if (about) parts.push(about.replace(/<[^>]+>/g, '').trim().slice(0, 120));
  if (skills) parts.push(`Skills: ${skills}`);

  desc = parts.join(' — ').slice(0, 160);
  return desc;
}

function buildKeywords(
  profile: Awaited<ReturnType<typeof fetchPublicProfile>>,
  subdomain: string,
): string[] {
  if (!profile) return [];
  const base = profile.seo.keywords?.filter(Boolean) ?? [];
  const name = profile.user.fullName;
  const role = profile.sections.experience?.[0]?.role ?? '';
  const skills = profile.sections.skills.slice(0, 8);
  const extra = [
    name,
    role && `${role} portfolio`,
    role && `${name} ${role}`,
    `${subdomain} portfolio`,
    'portfolio',
    ...skills.map((s) => `${s} developer`),
    'Blox portfolio',
  ].filter(Boolean) as string[];
  return [...new Set([...base, ...extra])].slice(0, 15);
}

const TEMPLATE_ACCENTS: Record<string, { color: string; bg: string }> = {
  'portfolio-modern-001': { color: '#1ECEFA', bg: '#080B12' },
  'portfolio-freelance-conversion': { color: '#F59E0B', bg: '#1C1917' },
  'portfolio-timeline-dev': { color: '#22C55E', bg: '#0D1117' },
  'portfolio-minimal-clean': { color: '#6366F1', bg: '#FFFFFF' },
  'portfolio-grid-showcase': { color: '#FBBF24', bg: '#4A0916' },
  'portfolio-neon-dev': { color: '#8B5CF6', bg: '#050008' },
  'portfolio-glass-dev': { color: '#6366F1', bg: '#020617' },
  'portfolio-studio-designer': { color: '#A855F7', bg: '#080812' },
  'portfolio-canvas-designer': { color: '#F97316', bg: '#FFF7ED' },
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
  const initials = profile.user.emailInitials || initialsFromEmail(undefined, profile.user.fullName);

  const subdomainDomain = `${subdomain}.${ROOT_DOMAIN}`;
  const canonical = profile.canonicalUrl ?? `https://${subdomainDomain}`;
  const jobTitle = profile.sections.experience?.[0]?.role;
  const ogSubtitle = jobTitle ?? profile.sections.hero.body?.slice(0, 60) ?? undefined;
  const ogImage = resolveOgImage(profile.seo.ogImageUrl, profile.seo.title, ogSubtitle, subdomainDomain);
  const faviconUrl = `/api/favicon?i=${encodeURIComponent(initials)}&c=${encodeURIComponent(accent.color)}&bg=${encodeURIComponent(accent.bg)}`;

  const description = buildSeoDescription(profile, subdomain);
  const keywords = buildKeywords(profile, subdomain);

  return {
    title: profile.seo.title,
    description,
    keywords,
    alternates: { canonical },
    icons: { icon: faviconUrl, shortcut: faviconUrl },
    robots: profile.seo.noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
        },
    openGraph: {
      title: profile.seo.title,
      description,
      url: canonical,
      type: 'profile',
      siteName: 'Blox',
      locale: 'en_US',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: profile.seo.imageAltMap?.hero ?? `${profile.user.fullName} — portfolio cover`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: profile.seo.title,
      description,
      images: [{ url: ogImage, alt: `${profile.user.fullName} portfolio` }],
    },
  };
}

export default async function SubdomainProfilePage({ params }: SubdomainPageProps) {
  const resolvedParams = await params;
  const subdomain = normalizeSubdomain(resolvedParams?.subdomain);
  if (!subdomain || isReservedSubdomain(subdomain)) notFound();

  const profile = await fetchPublicProfile(subdomain);
  if (!profile) notFound();

  const domain = `${subdomain}.${ROOT_DOMAIN}`;
  const canonical = profile.canonicalUrl ?? `https://${domain}`;
  const jobTitle = profile.sections.experience?.[0]?.role ?? undefined;
  const ogSubtitle = jobTitle ?? profile.sections.hero.body?.slice(0, 60) ?? undefined;
  const ogImage = resolveOgImage(profile.seo.ogImageUrl, profile.seo.title, ogSubtitle, domain);

  const sameAsLinks = profile.sections.links
    .map((link) => absoluteUrl(link.url))
    .filter((url): url is string => !!url && url.startsWith('http'));

  // JSON-LD: Person / ProfilePage schema
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
      ...(profile.sections.skills.length > 0
        ? { knowsAbout: profile.sections.skills.slice(0, 12) }
        : {}),
    },
  };

  // JSON-LD: Projects as ItemList of CreativeWork
  const projectsJsonLd =
    profile.sections.projects.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `${profile.user.fullName} — Projects`,
          url: canonical,
          itemListElement: profile.sections.projects.map((project, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'CreativeWork',
              name: project.title,
              ...(project.description ? { description: project.description } : {}),
              ...(project.url ? { url: project.url } : {}),
              ...(project.imageUrl || project.snapshotUrl
                ? {
                    image: {
                      '@type': 'ImageObject',
                      url: project.imageUrl ?? project.snapshotUrl,
                      description: `${project.title} — project screenshot`,
                    },
                  }
                : {}),
              author: { '@type': 'Person', name: profile.user.fullName, url: canonical },
              keywords: project.tags?.join(', '),
            },
          })),
        }
      : null;

  // JSON-LD: BreadcrumbList for navigation clarity
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blox.app' },
      { '@type': 'ListItem', position: 2, name: profile.user.fullName, item: canonical },
    ],
  };

  const seoTitle = profile.seo.title;

  return (
    <>
      {/* JSON-LD Structured Data */}
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Client-side view + link-click tracking */}
      <PortfolioViewTracker subdomain={subdomain} portfolioTitle={seoTitle} />

      {/* Portfolio template */}
      <PortfolioTemplateRenderer profile={profile} subdomain={subdomain} />
    </>
  );
}
