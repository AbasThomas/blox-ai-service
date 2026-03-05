import type {
  PublicProfilePayload,
  PublicProfileProjectItem,
  SmartLink,
} from '@nextjs-blox/shared-types';
import { normalizePortfolioTemplateId } from './portfolio-templates';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) return trimmed;
  if (trimmed.startsWith('data:')) return trimmed;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return '';
}

function inferLinkLabel(url: string): string {
  if (url.startsWith('mailto:')) return 'Email';
  if (url.startsWith('tel:')) return 'Phone';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Link';
  }
}

function deriveEmailInitials(email: string): string | undefined {
  const local = email.split('@')[0]?.replace(/[^a-z0-9]/gi, '') ?? '';
  if (local.length >= 2) return local.slice(0, 2).toLowerCase();
  if (local.length === 1) return `${local.toLowerCase()}${local.toLowerCase()}`;
  return undefined;
}

function coerceLinks(value: unknown): SmartLink[] {
  if (!Array.isArray(value)) return [];

  const links: SmartLink[] = [];
  const seen = new Set<string>();

  for (const raw of value) {
    if (typeof raw === 'string') {
      const url = normalizeUrl(raw);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      links.push({ label: inferLinkLabel(url), url, kind: 'other' });
      continue;
    }

    const row = asRecord(raw);
    const url = normalizeUrl(asString(row.url) || asString(row.href));
    if (!url || seen.has(url)) continue;
    seen.add(url);
    links.push({
      label: asString(row.label) || inferLinkLabel(url),
      url,
      kind: (asString(row.kind) as SmartLink['kind']) || 'other',
      icon: asString(row.icon) || undefined,
    });
  }

  return links;
}

function coerceProjectImages(source: unknown) {
  if (!Array.isArray(source)) {
    return asStringArray(source)
      .map((value) => normalizeUrl(value))
      .filter(Boolean)
      .map((url) => ({ url }));
  }

  const output: Array<{ url: string; alt?: string }> = [];
  const seen = new Set<string>();
  for (const raw of source) {
    if (typeof raw === 'string') {
      const url = normalizeUrl(raw);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      output.push({ url });
      continue;
    }

    const row = asRecord(raw);
    const url = normalizeUrl(asString(row.url) || asString(row.imageUrl) || asString(row.src));
    if (!url || seen.has(url)) continue;
    seen.add(url);
    output.push({
      url,
      alt: asString(row.alt) || asString(row.caption) || undefined,
    });
  }
  return output;
}

function coerceProjects(value: unknown): PublicProfileProjectItem[] {
  if (!Array.isArray(value)) {
    return asStringArray(value).map((title) => ({ title }));
  }

  const projects: PublicProfileProjectItem[] = [];
  for (const raw of value) {
    if (typeof raw === 'string') {
      projects.push({ title: raw });
      continue;
    }

    const row = asRecord(raw);
    const title =
      asString(row.title) ||
      asString(row.name) ||
      asString(row.heading) ||
      asString(row.content);
    if (!title) continue;

    const description = asString(row.description) || asString(row.summary);
    const url = normalizeUrl(asString(row.url) || asString(row.href)) || undefined;
    const snapshotUrl =
      normalizeUrl(
        asString(row.snapshotUrl) ||
          asString(row.thumbnail) ||
          asString(row.imageUrl) ||
          asString(row.image),
      ) || undefined;
    const images = [
      ...coerceProjectImages(row.images),
      ...coerceProjectImages(row.gallery),
      ...coerceProjectImages(row.imageUrls),
    ];

    projects.push({
      title,
      ...(description ? { description } : {}),
      ...(url ? { url } : {}),
      ...(snapshotUrl ? { snapshotUrl } : {}),
      ...(snapshotUrl ? { imageUrl: snapshotUrl } : {}),
      ...(images.length > 0 ? { images } : {}),
      ...(asStringArray(row.tags).length > 0 ? { tags: asStringArray(row.tags).slice(0, 8) } : {}),
      ...(asString(row.caseStudy) ? { caseStudy: asString(row.caseStudy) } : {}),
    });
  }
  return projects;
}

function coerceExperience(value: unknown) {
  if (!Array.isArray(value)) {
    return asStringArray(value).map((role) => ({ role }));
  }
  return value
    .map((raw) => {
      if (typeof raw === 'string') return { role: raw };
      const row = asRecord(raw);
      const role = asString(row.role) || asString(row.title) || asString(row.name);
      if (!role) return null;
      return {
        role,
        summary: asString(row.summary) || asString(row.description) || undefined,
        company: asString(row.company) || undefined,
        period: asString(row.period) || undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => !!item);
}

function coerceCertifications(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      const row = asRecord(raw);
      const title = asString(row.title) || asString(row.name);
      if (!title) return null;
      return {
        title,
        issuer: asString(row.issuer) || undefined,
        date: asString(row.date) || asString(row.completedAt) || undefined,
        imageUrl:
          normalizeUrl(asString(row.imageUrl) || asString(row.image)) || undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => !!item);
}

export function buildPreviewProfile(input: {
  content: Record<string, unknown>;
  title?: string;
  seoConfig?: unknown;
  user?: { fullName?: string; email?: string };
  subdomain: string;
  publishedUrl?: string;
  templateId?: string;
}): PublicProfilePayload {
  const content = asRecord(input.content);
  const hero = asRecord(content.hero);
  const about = asRecord(content.about);
  const contact = asRecord(content.contact);
  const skills = asRecord(content.skills);
  const experience = asRecord(content.experience);
  const projects = asRecord(content.projects);
  const certifications = asRecord(content.certifications);
  const profile = asRecord(content.profile);
  const seoConfig = asRecord(input.seoConfig);

  const fullName =
    asString(input.user?.fullName) ||
    asString(hero.heading) ||
    asString(input.title) ||
    'Portfolio Owner';

  const heroHeading = asString(hero.heading) || fullName;
  const heroBody =
    asString(hero.body) || asString(about.body) || 'Portfolio profile';
  const aboutBody = asString(about.body) || heroBody;
  const contactBody = asString(contact.body) || 'Send a message using the form.';

  return {
    subdomain: input.subdomain,
    templateId: normalizePortfolioTemplateId(
      asString(input.templateId) || asString(content.templateId),
    ),
    canonicalUrl:
      asString(input.publishedUrl) || `https://${input.subdomain}.blox.app`,
    user: {
      fullName,
      emailInitials: deriveEmailInitials(asString(input.user?.email)),
      headline: heroHeading,
      avatarUrl: asString(profile.avatarUrl) || undefined,
    },
    seo: {
      title: asString(seoConfig.title) || `${fullName} | Portfolio`,
      description:
        asString(seoConfig.description) || aboutBody.slice(0, 160),
      keywords: asStringArray(seoConfig.keywords),
      ogImageUrl: asString(seoConfig.ogImage) || asString(seoConfig.ogImageUrl),
      noindex: false,
      structuredData: true,
      imageAltMap: {},
    },
    sections: {
      hero: {
        heading: heroHeading,
        body: heroBody,
      },
      about: aboutBody,
      experience: coerceExperience(experience.items ?? content.experience),
      projects: coerceProjects(projects.items ?? content.projects),
      certifications: coerceCertifications(
        certifications.items ?? content.certifications,
      ),
      skills: asStringArray(skills.items ?? content.skills),
      links: coerceLinks(content.links),
      contact: contactBody,
    },
    updatedAt: new Date().toISOString(),
  };
}
