import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'https://blox.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Disallow private/auth routes to save crawl budget
        disallow: [
          '/api/',
          '/dashboard',
          '/settings',
          '/admin',
          '/mfa',
          '/checkout',
          '/success',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/portfolios/',
          '/resumes/',
          '/cover-letters/',
          '/preview/',
          '/analytics/',
          '/collaborate/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
