import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublicProfile } from '@/lib/public-profile';
import { isReservedSubdomain } from '@/lib/subdomains';

export const revalidate = 300;

interface SubdomainPageProps {
  params: { subdomain: string };
}

function absoluteUrl(url: string): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('mailto:') || url.startsWith('tel:')) return url;
  return null;
}

export async function generateMetadata({ params }: SubdomainPageProps): Promise<Metadata> {
  const subdomain = params.subdomain.toLowerCase();
  if (isReservedSubdomain(subdomain)) {
    return {
      robots: { index: false, follow: false },
    };
  }

  const profile = await fetchPublicProfile(subdomain);
  if (!profile) {
    return {
      title: 'Profile Not Found',
      description: 'This profile does not exist.',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: profile.seo.title,
    description: profile.seo.description,
    keywords: profile.seo.keywords,
    alternates: {
      canonical: profile.canonicalUrl,
    },
    robots: profile.seo.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: profile.seo.title,
      description: profile.seo.description,
      url: profile.canonicalUrl,
      type: 'profile',
      images: [
        {
          url: profile.seo.ogImageUrl,
          alt: profile.seo.imageAltMap?.hero ?? `${profile.user.fullName} profile image`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: profile.seo.title,
      description: profile.seo.description,
      images: [profile.seo.ogImageUrl],
    },
  };
}

export default async function SubdomainProfilePage({ params }: SubdomainPageProps) {
  const subdomain = params.subdomain.toLowerCase();
  if (isReservedSubdomain(subdomain)) {
    notFound();
  }

  const profile = await fetchPublicProfile(subdomain);
  if (!profile) {
    notFound();
  }

  const profileJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: profile.user.fullName,
      description: profile.sections.about || profile.sections.hero.body,
      url: profile.canonicalUrl,
      image: profile.seo.ogImageUrl,
      sameAs: profile.sections.links
        .map((link) => absoluteUrl(link.url))
        .filter((url): url is string => !!url && url.startsWith('http')),
    },
    url: profile.canonicalUrl,
    dateModified: profile.updatedAt,
  };

  return (
    <article className="mx-auto w-full max-w-4xl space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }} />

      <header className="space-y-3 border-b border-slate-100 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{subdomain}.blox.app</p>
        <h1 className="text-4xl font-black text-slate-900">{profile.sections.hero.heading}</h1>
        <p className="max-w-3xl text-base text-slate-600">{profile.sections.hero.body}</p>
      </header>

      {profile.sections.links.length > 0 ? (
        <nav aria-label="Primary links">
          <ul className="grid gap-3 sm:grid-cols-2">
            {profile.sections.links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  className="block rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                  target={link.url.startsWith('http') ? '_blank' : undefined}
                  rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <main className="space-y-8">
        <section aria-labelledby="about-heading" className="space-y-2">
          <h2 id="about-heading" className="text-xl font-bold text-slate-900">About</h2>
          <p className="text-sm leading-7 text-slate-700">{profile.sections.about}</p>
        </section>

        {profile.sections.experience.length > 0 ? (
          <section aria-labelledby="experience-heading" className="space-y-3">
            <h2 id="experience-heading" className="text-xl font-bold text-slate-900">Experience</h2>
            <ul className="space-y-3">
              {profile.sections.experience.map((item, index) => (
                <li key={`${item.role}-${index}`} className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">{item.role}</h3>
                  {item.company ? <p className="text-xs text-slate-500">{item.company}</p> : null}
                  {item.summary ? <p className="mt-2 text-sm text-slate-700">{item.summary}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {profile.sections.projects.length > 0 ? (
          <section aria-labelledby="projects-heading" className="space-y-3">
            <h2 id="projects-heading" className="text-xl font-bold text-slate-900">Projects</h2>
            <ul className="space-y-3">
              {profile.sections.projects.map((project, index) => (
                <li key={`${project.title}-${index}`} className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">{project.title}</h3>
                  {project.description ? <p className="mt-2 text-sm text-slate-700">{project.description}</p> : null}
                  {project.url ? (
                    <p className="mt-2">
                      <a
                        href={project.url}
                        className="text-xs font-semibold text-blue-700 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View project
                      </a>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {profile.sections.skills.length > 0 ? (
          <section aria-labelledby="skills-heading" className="space-y-3">
            <h2 id="skills-heading" className="text-xl font-bold text-slate-900">Skills</h2>
            <ul className="flex flex-wrap gap-2">
              {profile.sections.skills.map((skill) => (
                <li key={skill} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700">
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      {profile.sections.contact ? (
        <footer className="border-t border-slate-100 pt-6">
          <h2 className="text-base font-bold text-slate-900">Contact</h2>
          <p className="mt-2 text-sm text-slate-700">{profile.sections.contact}</p>
        </footer>
      ) : null}
    </article>
  );
}

