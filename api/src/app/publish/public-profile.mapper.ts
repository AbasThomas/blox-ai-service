import {
  PublicProfileExperienceItem,
  PublicProfilePayload,
  PublicProfileProjectItem,
  SmartLink,
  SmartLinkKind,
} from '@nextjs-blox/shared-types';

interface AssetWithOwner {
  title: string;
  content: unknown;
  seoConfig: unknown;
  updatedAt: Date;
  user: {
    fullName: string;
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeUrl(urlLike: string): string | null {
  const value = urlLike.trim();
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('mailto:') || value.startsWith('tel:')) return value;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(value)) return `https://${value}`;
  return null;
}

function inferLabel(url: string): string {
  if (url.startsWith('mailto:')) return 'Email';
  if (url.startsWith('tel:')) return 'Phone';
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return hostname;
  } catch {
    return 'Link';
  }
}

function uniqByUrl(items: SmartLink[]): SmartLink[] {
  const seen = new Set<string>();
  const output: SmartLink[] = [];
  for (const item of items) {
    if (!item.url || seen.has(item.url)) continue;
    seen.add(item.url);
    output.push(item);
  }
  return output;
}

function extractLinksFromText(text: string): SmartLink[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s)]+/g) ?? [];
  return uniqByUrl(
    matches
      .map((raw) => normalizeUrl(raw))
      .filter((url): url is string => !!url)
      .map((url) => ({
        label: inferLabel(url),
        url,
        kind: 'other' as const,
      })),
  );
}

function coerceExperience(value: unknown): PublicProfileExperienceItem[] {
  if (!Array.isArray(value)) {
    return asStringArray(value).map((role) => ({ role }));
  }

  const items: PublicProfileExperienceItem[] = [];
  for (const raw of value) {
    if (typeof raw === 'string') {
      items.push({ role: raw });
      continue;
    }

    const row = asRecord(raw);
    const role =
      asString(row.role) ||
      asString(row.title) ||
      asString(row.heading) ||
      asString(row.name) ||
      asString(row.content);
    if (!role) continue;

    const summary = asString(row.summary) || asString(row.description);
    const company = asString(row.company);
    const period = asString(row.period);
    items.push({
      role,
      ...(summary ? { summary } : {}),
      ...(company ? { company } : {}),
      ...(period ? { period } : {}),
    });
  }

  return items;
}

function coerceProjects(value: unknown): PublicProfileProjectItem[] {
  if (!Array.isArray(value)) {
    return asStringArray(value).map((title) => ({ title }));
  }

  const items: PublicProfileProjectItem[] = [];
  for (const raw of value) {
    if (typeof raw === 'string') {
      items.push({ title: raw });
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
    const rawUrl = asString(row.url) || asString(row.href);
    const url = rawUrl ? normalizeUrl(rawUrl) ?? undefined : undefined;
    items.push({
      title,
      ...(description ? { description } : {}),
      ...(url ? { url } : {}),
    });
  }

  return items;
}

function parseKind(value: string): SmartLinkKind {
  const normalized = value.toLowerCase();
  if (
    normalized === 'primary' ||
    normalized === 'social' ||
    normalized === 'project' ||
    normalized === 'contact'
  ) {
    return normalized;
  }
  return 'other';
}

function coerceLinks(value: unknown): SmartLink[] {
  if (!Array.isArray(value)) return [];

  const items: SmartLink[] = [];
  for (const raw of value) {
    if (typeof raw === 'string') {
      const url = normalizeUrl(raw);
      if (!url) continue;
      items.push({ label: inferLabel(url), url, kind: 'other' });
      continue;
    }

    const row = asRecord(raw);
    const urlCandidate = asString(row.url) || asString(row.href) || asString(row.target);
    const url = normalizeUrl(urlCandidate);
    if (!url) continue;

    const kind = parseKind(asString(row.kind));
    const label = asString(row.label) || asString(row.title) || inferLabel(url);
    const icon = asString(row.icon);
    items.push({
      label,
      url,
      kind,
      ...(icon ? { icon } : {}),
    });
  }

  return uniqByUrl(items);
}

function truncate(input: string, max = 160): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 3).trimEnd()}...`;
}

function pickKeywords(title: string, skills: string[], seoKeywords: string[]): string[] {
  const tokens = [
    ...seoKeywords,
    ...title
      .split(/[\s/-]+/)
      .map((part) => part.trim().toLowerCase())
      .filter((part) => part.length > 2),
    ...skills.map((skill) => skill.toLowerCase()),
  ];

  const unique: string[] = [];
  for (const token of tokens) {
    if (!token || unique.includes(token)) continue;
    unique.push(token);
    if (unique.length >= 12) break;
  }
  return unique;
}

function getAppBaseUrl(): string {
  const raw = process.env.APP_BASE_URL ?? 'https://blox.app';
  return raw.replace(/\/$/, '');
}

function getAppHost(): string {
  const raw = getAppBaseUrl();
  try {
    return new URL(raw).host;
  } catch {
    return raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}

export function mapAssetToPublicProfile(input: {
  subdomain: string;
  asset: AssetWithOwner;
}): PublicProfilePayload {
  const { subdomain, asset } = input;
  const content = asRecord(asset.content);
  const seoConfig = asRecord(asset.seoConfig);

  const hero = asRecord(content.hero);
  const about = asRecord(content.about);
  const experience = asRecord(content.experience);
  const projects = asRecord(content.projects);
  const skills = asRecord(content.skills);
  const contact = asRecord(content.contact);

  let heroHeading = asString(hero.heading) || asset.user.fullName || asset.title;
  let heroBody = asString(hero.body);
  let aboutBody = asString(about.body);
  let experienceItems = coerceExperience(experience.items ?? content.experience);
  let projectItems = coerceProjects(projects.items ?? content.projects);
  let skillItems = asStringArray(skills.items ?? content.skills);
  let contactBody = asString(contact.body);
  let links = coerceLinks(content.links);

  const legacySections = Array.isArray(content.sections) ? content.sections : [];
  for (const sectionRaw of legacySections) {
    const section = asRecord(sectionRaw);
    const type = asString(section.type).toLowerCase();
    const text = asString(section.content);
    if (!type || !text) continue;

    if ((type === 'hero' || type === 'summary') && !heroBody) heroBody = text;
    if (type === 'about' && !aboutBody) aboutBody = text;
    if ((type === 'experience' || type === 'work') && experienceItems.length === 0) {
      experienceItems = coerceExperience(text);
    }
    if (type === 'projects' && projectItems.length === 0) {
      projectItems = coerceProjects(text);
    }
    if (type === 'skills' && skillItems.length === 0) {
      skillItems = asStringArray(text);
    }
    if (type === 'contact' && !contactBody) contactBody = text;
  }

  if (!heroBody) heroBody = aboutBody || contactBody || 'Portfolio profile';
  if (!aboutBody) aboutBody = heroBody;
  if (!heroHeading) heroHeading = asset.user.fullName || asset.title;

  if (links.length === 0) {
    links = uniqByUrl([
      ...extractLinksFromText(contactBody),
      ...extractLinksFromText(aboutBody),
      ...extractLinksFromText(heroBody),
    ]);
  }

  const seoTitle = asString(seoConfig.title) || truncate(`${heroHeading} | ${asset.title}`, 60);
  const seoDescription = asString(seoConfig.description) || truncate(aboutBody || heroBody, 155);
  const seoKeywords = pickKeywords(asset.title, skillItems, asStringArray(seoConfig.keywords));

  const imageAltMapSource = asRecord(seoConfig.imageAltMap);
  const imageAltMap: Record<string, string> = {};
  for (const [key, value] of Object.entries(imageAltMapSource)) {
    const text = asString(value);
    if (text) imageAltMap[key] = text;
  }
  if (!imageAltMap.hero) {
    imageAltMap.hero = `${asset.user.fullName} portfolio cover image`;
  }

  const ogImageUrl =
    asString(seoConfig.ogImage) ||
    asString(seoConfig.ogImageUrl) ||
    `https://dummyimage.com/1200x630/0f172a/ffffff.png&text=${encodeURIComponent(heroHeading)}`;

  return {
    subdomain,
    canonicalUrl: `https://${subdomain}.${getAppHost()}`,
    user: {
      fullName: asset.user.fullName,
      headline: heroHeading,
      avatarUrl: asString(asRecord(content.profile).avatarUrl) || undefined,
    },
    seo: {
      title: seoTitle,
      description: seoDescription,
      keywords: seoKeywords,
      ogImageUrl,
      noindex: !!seoConfig.noindex,
      structuredData: seoConfig.structuredData !== false,
      imageAltMap,
    },
    sections: {
      hero: {
        heading: heroHeading,
        body: heroBody,
      },
      about: aboutBody,
      experience: experienceItems,
      projects: projectItems,
      skills: skillItems,
      links,
      contact: contactBody,
    },
    updatedAt: asset.updatedAt.toISOString(),
  };
}
