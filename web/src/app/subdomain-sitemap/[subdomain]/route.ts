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
  const lastmod = profile.updatedAt
    ? new Date(profile.updatedAt).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const format = new URL(request.url).searchParams.get('format');

  if (format === 'robots') {
    const robots = [
      'User-agent: *',
      'Allow: /',
      `Sitemap: ${baseUrl}/sitemap.xml`,
      '',
    ].join('\n');
    return new NextResponse(robots, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      },
    });
  }

  // Build one <url> entry per visible section so crawlers can index deep
  const urls: { loc: string; priority: string }[] = [
    { loc: `${baseUrl}/`, priority: '1.0' },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
    },
  });
}
