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

/** Build optimised SEO title: "Name - Role Portfolio | City" (50–60 chars) */
function buildSeoTitle(
  profile: Awaited<ReturnType<typeof fetchPublicProfile>>,
  subdomain: string,
): string {
  if (!profile) return '';
  const stored = profile.seo.title || '';
  // Use stored title only if it looks fully formed (contains a dash or pipe)
  if (stored && (stored.includes(' - ') || stored.includes(' | ')) && stored.length <= 65) {
    return stored;
  }
  const name = profile.user.fullName;
  const role = profile.sections.experience?.[0]?.role;
  const location = profile.user.location;

  // Build: "Name - Role Portfolio | City" capped at 65 chars
  let title = name;
  if (role) title += ` - ${role}`;
  if (!title.toLowerCase().includes('portfolio')) title += ' Portfolio';
  if (location) {
    const suffix = ` | ${location.split(',')[0].trim()}`;
    if ((title + suffix).length <= 65) title += suffix;
  }
  return title.slice(0, 65);
}

/** Build a keyword-enriched description for SEO */
function buildSeoDescription(
  profile: Awaited<ReturnType<typeof fetchPublicProfile>>,
  subdomain: string,
): string {
  if (!profile) return '';
  const name = profile.user.fullName;
  const role = profile.sections.experience?.[0]?.role;
  const location = profile.user.location;
  const about = profile.sections.about || profile.sections.hero.body || '';
  const skills = profile.sections.skills.slice(0, 5).join(', ');

  let desc = profile.seo.description || '';
  if (desc && desc.length >= 80) return desc;

  // Auto-generate: "Alex Morgan, Senior Engineer in Lagos — React, Node.js, AWS. View portfolio."
  const parts: string[] = [];
  if (role && location) parts.push(`${name}, ${role} in ${location}`);
  else if (role) parts.push(`${name}, ${role}`);
  else parts.push(name);
  if (about) parts.push(about.replace(/<[^>]+>/g, '').trim().slice(0, 100));
  if (skills) parts.push(`Skills: ${skills}.`);
  if (!parts.join(' ').toLowerCase().includes('portfolio')) parts.push('View portfolio on Blox.');

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
  const skills = profile.sections.skills.slice(0, 6);
  const location = profile.user.location ?? '';
  const locationCity = location.split(',')[0]?.trim() ?? '';
  const locationCountry = location.split(',')[1]?.trim() ?? '';

  const extra = [
    name,
    role && `${role} portfolio`,
    role && `${name} ${role}`,
    role && location && `${role} ${locationCity}`,
    role && locationCountry && `${role} ${locationCountry}`,
    name && location && `${name} ${locationCity}`,
    `${subdomain} portfolio`,
    'portfolio',
    ...skills,
    location && `developer in ${locationCity}`,
    'Blox portfolio',
  ].filter(Boolean) as string[];
  return [...new Set([...base, ...extra])].slice(0, 20);
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

  const seoTitle = buildSeoTitle(profile, subdomain);
  const description = buildSeoDescription(profile, subdomain);
  const keywords = buildKeywords(profile, subdomain);

  // Add avatar to OG image when available
  const avatarParam = profile.user.avatarUrl ? `&avatar=${encodeURIComponent(profile.user.avatarUrl)}` : '';
  const ogImageWithAvatar = ogImage.includes('/og?') ? `${ogImage}${avatarParam}` : ogImage;

  return {
    title: seoTitle,
    description,
    keywords,
    authors: [{ name: profile.user.fullName, url: canonical }],
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
      title: seoTitle,
      description,
      url: canonical,
      type: 'profile',
      siteName: 'Blox',
      locale: 'en_US',
      images: [
        {
          url: ogImageWithAvatar,
          width: 1200,
          height: 630,
          alt: profile.seo.imageAltMap?.hero ?? `${profile.user.fullName} — portfolio cover`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description,
      images: [{ url: ogImageWithAvatar, alt: `${profile.user.fullName} portfolio` }],
      ...(profile.user.twitterHandle ? { creator: `@${profile.user.twitterHandle}` } : {}),
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

  // Code customizations — CSS + config saved by the user in the code editor
  const customCss = (profile as unknown as { codeCustomizations?: { css?: string } })
    ?.codeCustomizations?.css ?? '';
  const jobTitle = profile.sections.experience?.[0]?.role ?? undefined;
  const ogSubtitle = jobTitle ?? profile.sections.hero.body?.slice(0, 60) ?? undefined;
  const ogImage = resolveOgImage(profile.seo.ogImageUrl, profile.seo.title, ogSubtitle, domain);

  const sameAsLinks = profile.sections.links
    .map((link) => absoluteUrl(link.url))
    .filter((url): url is string => !!url && url.startsWith('http'));

  // Person image: prefer real avatar for Knowledge Panel eligibility; fall back to OG image
  const personImageObjects: object[] = [];
  if (profile.user.avatarUrl) {
    personImageObjects.push({
      '@type': 'ImageObject',
      url: profile.user.avatarUrl,
      // Dimensions unknown for uploaded photos — omit to avoid invalid markup
      description: `${profile.user.fullName} profile photo`,
    });
  }
  personImageObjects.push({ '@type': 'ImageObject', url: ogImage, width: 1200, height: 630 });

  // Location breakdown for PostalAddress
  const locationParts = (profile.user.location ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const addressLocality = locationParts[0] ?? undefined;
  const addressCountry = locationParts[1] ?? undefined;

  // JSON-LD: ProfilePage + Person entity (main entity of page)
  const profileJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: buildSeoTitle(profile, subdomain),
    description: profile.sections.about || profile.sections.hero.body,
    dateModified: profile.updatedAt,
    dateCreated: profile.updatedAt, // updatedAt used as best proxy if no createdAt
    mainEntity: {
      '@type': 'Person',
      '@id': `${canonical}#person`,
      name: profile.user.fullName,
      ...(jobTitle ? { jobTitle } : {}),
      description: profile.sections.about || profile.sections.hero.body,
      url: canonical,
      image: personImageObjects.length === 1 ? personImageObjects[0] : personImageObjects,
      sameAs: sameAsLinks,
      ...(profile.sections.skills.length > 0
        ? { knowsAbout: profile.sections.skills.slice(0, 12) }
        : {}),
      ...((addressLocality || addressCountry)
        ? {
            address: {
              '@type': 'PostalAddress',
              ...(addressLocality ? { addressLocality } : {}),
              ...(addressCountry ? { addressCountry } : {}),
            },
            homeLocation: {
              '@type': 'Place',
              name: profile.user.location,
            },
          }
        : {}),
      ...(profile.sections.experience.length > 0
        ? {
            worksFor: profile.sections.experience.slice(0, 2).map((exp) => ({
              '@type': 'Organization',
              name: exp.company || exp.role,
              ...(exp.company ? { employee: { '@type': 'Person', name: profile.user.fullName } } : {}),
            })),
          }
        : {}),
    },
  };

  // JSON-LD: WebSite for portfolio domain (enables sitelinks search box signal)
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${canonical}#website`,
    url: canonical,
    name: `${profile.user.fullName} Portfolio`,
    description: profile.sections.about || profile.sections.hero.body,
    publisher: { '@id': `${canonical}#person` },
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
              author: { '@type': 'Person', '@id': `${canonical}#person`, name: profile.user.fullName, url: canonical },
              ...(project.tags?.length ? { keywords: project.tags.join(', ') } : {}),
            },
          })),
        }
      : null;

  // JSON-LD: BreadcrumbList for navigation clarity
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: profile.user.fullName, item: canonical },
    ],
  };

  const seoTitle = buildSeoTitle(profile, subdomain);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
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

      {/* Code editor CSS customizations (injected from user's saved code) */}
      {customCss ? (
        <style dangerouslySetInnerHTML={{ __html: customCss }} />
      ) : null}

      {/* Client-side view + link-click tracking */}
      <PortfolioViewTracker subdomain={subdomain} portfolioTitle={seoTitle} />

      {/* Portfolio template */}
      <PortfolioTemplateRenderer profile={profile} subdomain={subdomain} />
    </>
  );
}
