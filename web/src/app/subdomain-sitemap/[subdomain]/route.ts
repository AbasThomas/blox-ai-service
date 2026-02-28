import { NextResponse } from 'next/server';
import { fetchPublicProfile } from '@/lib/public-profile';
import { isReservedSubdomain } from '@/lib/subdomains';

export async function GET(
  request: Request,
  context: { params: Promise<{ subdomain: string }> },
) {
  const { subdomain } = await context.params;
  const slug = subdomain.toLowerCase();
  if (isReservedSubdomain(slug)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const profile = await fetchPublicProfile(slug);
  if (!profile) {
    return new NextResponse('Not found', { status: 404 });
  }

  const baseUrl = profile.canonicalUrl;
  const format = new URL(request.url).searchParams.get('format');

  if (format === 'robots') {
    const robots = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`;
    return new NextResponse(robots, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      },
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc></url>
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
    },
  });
}
