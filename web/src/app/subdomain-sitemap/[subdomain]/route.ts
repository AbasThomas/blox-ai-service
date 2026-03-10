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

  const baseUrl = profile.canonicalUrl.replace(/\/$/, '');
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

  // Determine which sections are present and build section URLs
  const sectionAnchors: Array<{ anchor: string; priority: string; label: string }> = [];

  if (profile.sections.about) {
    sectionAnchors.push({ anchor: 'about', priority: '0.9', label: 'About' });
  }
  if (profile.sections.experience.length > 0) {
    sectionAnchors.push({ anchor: 'experience', priority: '0.8', label: 'Experience' });
  }
  if (profile.sections.projects.length > 0) {
    sectionAnchors.push({ anchor: 'projects', priority: '0.9', label: 'Projects' });
  }
  if (profile.sections.skills.length > 0) {
    sectionAnchors.push({ anchor: 'skills', priority: '0.7', label: 'Skills' });
  }
  if (profile.sections.certifications.length > 0) {
    sectionAnchors.push({ anchor: 'certifications', priority: '0.7', label: 'Certifications' });
  }
  if (profile.sections.contact) {
    sectionAnchors.push({ anchor: 'contact', priority: '0.8', label: 'Contact' });
  }

  // Collect project images for image sitemap extension
  const projectImages: Array<{ url: string; title: string; caption: string }> = [];
  for (const project of profile.sections.projects) {
    const imgUrl = project.imageUrl || project.snapshotUrl;
    if (imgUrl && imgUrl.startsWith('https://')) {
      projectImages.push({
        url: imgUrl,
        title: `${project.title} — ${profile.user.fullName}`,
        caption: project.description
          ? project.description.replace(/<[^>]+>/g, '').slice(0, 200)
          : `${project.title} project by ${profile.user.fullName}`,
      });
    }
    // Also include additional gallery images
    for (const img of project.images ?? []) {
      if (img.url && img.url.startsWith('https://') && img.url !== imgUrl) {
        projectImages.push({
          url: img.url,
          title: img.alt || project.title,
          caption: `${project.title} by ${profile.user.fullName}`,
        });
      }
    }
  }

  // Avatar image
  const avatarImages: Array<{ url: string; title: string; caption: string }> = [];
  if (profile.user.avatarUrl && profile.user.avatarUrl.startsWith('https://')) {
    avatarImages.push({
      url: profile.user.avatarUrl,
      title: `${profile.user.fullName} profile photo`,
      caption: `${profile.user.fullName}${profile.sections.experience[0]?.role ? `, ${profile.sections.experience[0].role}` : ''}`,
    });
  }

  // Helper: render <image:image> entries
  function renderImages(images: Array<{ url: string; title: string; caption: string }>): string {
    return images
      .map(
        (img) =>
          `    <image:image>
      <image:loc>${escapeXml(img.url)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
      <image:caption>${escapeXml(img.caption)}</image:caption>
    </image:image>`,
      )
      .join('\n');
  }

  function escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Build URL entries
  const homepageImages = [...avatarImages, ...projectImages.slice(0, 5)];

  const urlEntries: string[] = [
    // Homepage entry with all major images
    `  <url>
    <loc>${escapeXml(baseUrl)}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
${renderImages(homepageImages)}
  </url>`,
    // Section anchor entries
    ...sectionAnchors.map(
      ({ anchor, priority }) => `  <url>
    <loc>${escapeXml(baseUrl)}/#${anchor}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`,
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries.join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
    },
  });
}
