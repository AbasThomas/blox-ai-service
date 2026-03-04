import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { fetchPublicProfile } from '@/lib/public-profile';
import { normalizePortfolioTemplateId } from '@/lib/portfolio-templates';
import { isReservedSubdomain } from '@/lib/subdomains';

export const revalidate = 300;

const BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'https://blox.app';

interface SubdomainPageProps {
  params: { subdomain?: string } | Promise<{ subdomain?: string }>;
}

interface TemplateTheme {
  wrapper: string;
  hero: string;
  section: string;
  linkGrid: string;
  projectsGrid: string;
  certificationsGrid: string;
  skillsWrap: string;
  skillChip: string;
  contactButton: string;
  sectionOrder: Array<
    | 'about'
    | 'experience'
    | 'projects'
    | 'certifications'
    | 'skills'
    | 'links'
    | 'contact'
  >;
}

const TEMPLATE_THEMES: Record<string, TemplateTheme> = {
  'portfolio-modern-001': {
    wrapper: 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8',
    hero: 'border-b border-slate-100 pb-6',
    section: 'space-y-3 rounded-xl border border-slate-200 bg-white p-5',
    linkGrid: 'grid gap-3 sm:grid-cols-2',
    projectsGrid: 'grid gap-4 sm:grid-cols-2',
    certificationsGrid: 'grid gap-3 sm:grid-cols-2',
    skillsWrap: 'flex flex-wrap gap-2',
    skillChip: 'rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700',
    contactButton:
      'inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700',
    sectionOrder: ['about', 'experience', 'projects', 'certifications', 'skills', 'links', 'contact'],
  },
  'portfolio-freelance-conversion': {
    wrapper: 'rounded-2xl border border-amber-200 bg-amber-50/30 p-6 shadow-sm sm:p-8',
    hero: 'rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5',
    section: 'space-y-3 rounded-xl border border-slate-200 bg-white p-5',
    linkGrid: 'grid gap-2 sm:grid-cols-2',
    projectsGrid: 'grid gap-4 sm:grid-cols-2',
    certificationsGrid: 'grid gap-3 sm:grid-cols-2',
    skillsWrap: 'flex flex-wrap gap-2',
    skillChip: 'rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800',
    contactButton:
      'inline-flex items-center rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600',
    sectionOrder: ['projects', 'about', 'skills', 'experience', 'certifications', 'links', 'contact'],
  },
  'portfolio-timeline-dev': {
    wrapper: 'rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm sm:p-8',
    hero: 'border-b border-indigo-100 pb-6',
    section: 'space-y-3 rounded-xl border border-indigo-100 bg-white p-5',
    linkGrid: 'grid gap-2 sm:grid-cols-2',
    projectsGrid: 'grid gap-3 sm:grid-cols-2',
    certificationsGrid: 'grid gap-3 sm:grid-cols-2',
    skillsWrap: 'flex flex-wrap gap-2',
    skillChip: 'rounded-full border border-indigo-200 px-3 py-1 text-xs font-medium text-indigo-700',
    contactButton:
      'inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100',
    sectionOrder: ['experience', 'projects', 'about', 'skills', 'certifications', 'links', 'contact'],
  },
  'portfolio-minimal-clean': {
    wrapper: 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8',
    hero: 'pb-4',
    section: 'space-y-3 py-1',
    linkGrid: 'space-y-1',
    projectsGrid: 'space-y-3',
    certificationsGrid: 'space-y-2',
    skillsWrap: 'flex flex-wrap gap-2',
    skillChip: 'rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700',
    contactButton:
      'inline-flex items-center text-sm font-semibold text-slate-900 underline underline-offset-4',
    sectionOrder: ['about', 'projects', 'experience', 'skills', 'certifications', 'contact', 'links'],
  },
  'portfolio-grid-showcase': {
    wrapper: 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8',
    hero: 'rounded-xl border border-slate-200 bg-slate-50 p-5',
    section: 'space-y-3 rounded-xl border border-slate-200 bg-white p-5',
    linkGrid: 'flex flex-wrap gap-2',
    projectsGrid: 'grid gap-4 md:grid-cols-2 xl:grid-cols-3',
    certificationsGrid: 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3',
    skillsWrap: 'flex flex-wrap gap-2',
    skillChip: 'rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700',
    contactButton:
      'inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700',
    sectionOrder: ['projects', 'about', 'experience', 'certifications', 'skills', 'links', 'contact'],
  },
};

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

function imageUrl(url: string | undefined): string | null {
  const value = (url ?? '').trim();
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:image/')) {
    return value;
  }
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

function sectionTitle(title: string) {
  return <h2 className="text-xl font-semibold text-slate-900">{title}</h2>;
}

function contactLink(profile: PublicProfilePayload) {
  return (
    profile.sections.links.find(
      (link) =>
        link.kind === 'contact' ||
        link.url.startsWith('mailto:') ||
        link.url.startsWith('tel:'),
    ) ?? profile.sections.links[0]
  );
}

function renderTemplate(profile: PublicProfilePayload, subdomain: string) {
  const templateId = normalizePortfolioTemplateId(profile.templateId);
  const theme = TEMPLATE_THEMES[templateId] ?? TEMPLATE_THEMES['portfolio-modern-001'];
  const avatar = imageUrl(profile.user.avatarUrl);
  const primaryContact = contactLink(profile);

  const sections: Record<TemplateTheme['sectionOrder'][number], ReactNode> = {
    about: profile.sections.about ? (
      <section className={theme.section}>
        {sectionTitle('About')}
        <p className="text-sm leading-7 text-slate-700">{profile.sections.about}</p>
      </section>
    ) : null,
    experience: profile.sections.experience.length > 0 ? (
      <section className={theme.section}>
        {sectionTitle('Experience')}
        <ul className={templateId === 'portfolio-timeline-dev' ? 'space-y-5 border-l-2 border-indigo-100 pl-4' : 'space-y-3'}>
          {profile.sections.experience.map((item, index) => (
            <li key={`${item.role}-${index}`} className={templateId === 'portfolio-timeline-dev' ? 'relative' : 'rounded-lg border border-slate-200 p-3'}>
              {templateId === 'portfolio-timeline-dev' ? (
                <span className="absolute -left-[1.42rem] top-2 h-2.5 w-2.5 rounded-full bg-indigo-400" />
              ) : null}
              <h3 className="text-sm font-semibold text-slate-900">{item.role}</h3>
              {item.company ? <p className="text-xs text-slate-500">{item.company}</p> : null}
              {item.summary ? <p className="mt-1 text-sm text-slate-700">{item.summary}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    ) : null,
    projects: profile.sections.projects.length > 0 ? (
      <section className={theme.section}>
        {sectionTitle('Projects')}
        <ul className={theme.projectsGrid}>
          {profile.sections.projects.map((project, index) => (
            <li key={`${project.title}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {project.imageUrl && templateId !== 'portfolio-minimal-clean' ? (
                <img src={project.imageUrl} alt={`${project.title} preview`} className="h-36 w-full object-cover" loading="lazy" />
              ) : null}
              <div className="space-y-2 p-4">
                <h3 className="text-sm font-semibold text-slate-900">{project.title}</h3>
                {project.description ? <p className="text-sm text-slate-700">{project.description}</p> : null}
                {project.url ? (
                  <a href={project.url} className="inline-flex text-xs font-semibold text-blue-700 hover:underline" target="_blank" rel="noopener noreferrer">
                    View project
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    ) : null,
    certifications: profile.sections.certifications.length > 0 ? (
      <section className={theme.section}>
        {sectionTitle('Certifications')}
        <ul className={theme.certificationsGrid}>
          {profile.sections.certifications.map((item, index) => (
            <li key={`${item.title}-${index}`} className="rounded-lg border border-slate-200 p-3">
              <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
              {item.issuer ? <p className="text-xs text-slate-500">{item.issuer}</p> : null}
              {item.date ? <p className="text-xs text-slate-500">{item.date}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    ) : null,
    skills: profile.sections.skills.length > 0 ? (
      <section className={theme.section}>
        {sectionTitle('Skills')}
        <ul className={theme.skillsWrap}>
          {profile.sections.skills.map((skill) => (
            <li key={skill} className={theme.skillChip}>
              {skill}
            </li>
          ))}
        </ul>
      </section>
    ) : null,
    links: profile.sections.links.length > 0 ? (
      <section className={theme.section}>
        {sectionTitle('Links')}
        <ul className={theme.linkGrid}>
          {profile.sections.links.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                className="block rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                target={link.url.startsWith('http') ? '_blank' : undefined}
                rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    ) : null,
    contact: profile.sections.contact ? (
      <section className={theme.section}>
        {sectionTitle('Contact')}
        <p className="text-sm text-slate-700">{profile.sections.contact}</p>
      </section>
    ) : null,
  };

  return (
    <article className={`mx-auto w-full max-w-6xl space-y-6 overflow-x-hidden ${theme.wrapper}`}>
      <header className={theme.hero}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {avatar ? (
            <img
              src={avatar}
              alt={`${profile.user.fullName} profile image`}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-100"
              loading="lazy"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500">{subdomain}.blox.app</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900 sm:text-4xl">
              {profile.sections.hero.heading}
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">{profile.sections.hero.body}</p>
          </div>
          {primaryContact ? (
            <a
              href={primaryContact.url}
              className={theme.contactButton}
              target={primaryContact.url.startsWith('http') ? '_blank' : undefined}
              rel={primaryContact.url.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              Contact
            </a>
          ) : null}
        </div>
      </header>
      {theme.sectionOrder.map((key) => (sections[key] ? <div key={key}>{sections[key]}</div> : null))}
    </article>
  );
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

  const subdomainDomain = `${subdomain}.${BASE_URL.replace(/^https?:\/\//, '')}`;
  const canonical = profile.canonicalUrl ?? `https://${subdomainDomain}`;
  const heroRole = profile.sections.experience?.[0]?.role;
  const ogSubtitle = heroRole ?? profile.sections.hero.body?.slice(0, 60) ?? undefined;
  const ogImage = resolveOgImage(profile.seo.ogImageUrl, profile.seo.title, ogSubtitle, subdomainDomain);

  return {
    title: profile.seo.title,
    description: profile.seo.description,
    keywords: profile.seo.keywords,
    alternates: { canonical },
    robots: profile.seo.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: {
      title: profile.seo.title,
      description: profile.seo.description,
      url: canonical,
      type: 'profile',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: profile.seo.imageAltMap?.hero ?? `${profile.user.fullName} - portfolio cover`,
        },
      ],
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
      image: {
        '@type': 'ImageObject',
        url: ogImage,
        width: 1200,
        height: 630,
      },
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
              author: {
                '@type': 'Person',
                name: profile.user.fullName,
                url: canonical,
              },
            },
          })),
        }
      : null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }} />
      {projectsJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(projectsJsonLd) }} />
      ) : null}
      {renderTemplate(profile, subdomain)}
    </div>
  );
}
