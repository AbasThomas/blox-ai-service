import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/private'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'https://blox.app'}/sitemap.xml`,
  };
}

