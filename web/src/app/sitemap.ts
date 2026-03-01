import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'https://blox.app';
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333').replace(/\/$/, '');

interface PublicPortfolioEntry {
  subdomain: string;
  canonicalUrl?: string;
  updatedAt?: string;
}

async function fetchPublishedPortfolios(): Promise<PublicPortfolioEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/v1/public`, {
      next: { revalidate: 3600 }, // refresh list every hour
    });
    if (!res.ok) return [];
    const data = await res.json();
    // API may return an array directly or { items: [...] }
    return Array.isArray(data) ? data : (data?.items ?? []);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,           changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/pricing`,    changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/templates`,  changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/marketplace`,changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/help`,       changeFrequency: 'monthly', priority: 0.6 },
    // Auth pages intentionally excluded — they carry noindex anyway
  ].map((entry) => ({ ...entry, lastModified: new Date() }));

  const portfolios = await fetchPublishedPortfolios();

  const portfolioRoutes: MetadataRoute.Sitemap = portfolios.map((p) => ({
    url: p.canonicalUrl ?? `https://${p.subdomain}.${BASE_URL.replace(/^https?:\/\//, '')}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...portfolioRoutes];
}
