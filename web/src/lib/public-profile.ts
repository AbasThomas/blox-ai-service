import { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { cache } from 'react';
import { isReservedSubdomain } from './subdomains';

function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333';
  return raw.replace(/\/$/, '');
}

export const fetchPublicProfile = cache(async (subdomain: string): Promise<PublicProfilePayload | null> => {
  const slug = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (!slug || isReservedSubdomain(slug)) return null;

  const response = await fetch(`${getApiBaseUrl()}/v1/public/${encodeURIComponent(slug)}`, {
    next: { revalidate: 300, tags: [`public-profile-${slug}`] },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch public profile (${response.status})`);
  }

  return response.json() as Promise<PublicProfilePayload>;
});
