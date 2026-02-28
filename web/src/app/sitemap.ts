import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'https://blox.app';

  return [
    '/',
    '/signup',
    '/login',
    '/templates',
    '/marketplace',
    '/help',
    '/pricing',
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: 'daily' as const,
    priority: path === '/' ? 1 : 0.7,
    lastModified: new Date(),
  }));
}

