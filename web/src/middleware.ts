import { NextRequest, NextResponse } from 'next/server';
import { RESERVED_SUBDOMAINS } from './lib/subdomains';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'blox.app';

/**
 * Reads the hostname from the request, strips the port, and returns the
 * leading segment if it is a subdomain of ROOT_DOMAIN.
 *
 * Examples (ROOT_DOMAIN = "blox.app"):
 *   thomas.blox.app  → "thomas"
 *   www.blox.app     → "www"
 *   blox.app         → null  (apex domain – no subdomain)
 *   localhost:4200   → null
 */
function extractSubdomain(req: NextRequest): string | null {
  const hostname = req.headers.get('host') ?? '';
  // Strip port number (e.g. localhost:3000 → localhost)
  const host = hostname.split(':')[0];

  if (!host.endsWith(`.${ROOT_DOMAIN}`)) return null;

  const sub = host.slice(0, host.length - ROOT_DOMAIN.length - 1);
  return sub || null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const subdomain = extractSubdomain(req);

  // Not a subdomain request – pass through normally.
  if (!subdomain) return NextResponse.next();

  // Reserved subdomains (api, www, dashboard …) are handled by the main app;
  // let them through without rewriting.
  if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
    return NextResponse.next();
  }

  // For the root of a user subdomain (thomas.blox.app/) rewrite to /thomas
  // while keeping all other path segments intact so that per-user assets can
  // be served (e.g. thomas.blox.app/sitemap.xml → /subdomain-sitemap/thomas).
  if (pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = `/${subdomain}`;
    return NextResponse.rewrite(url);
  }

  // Per-subdomain sitemap: thomas.blox.app/sitemap.xml
  if (pathname === '/sitemap.xml') {
    const url = req.nextUrl.clone();
    url.pathname = `/subdomain-sitemap/${subdomain}`;
    return NextResponse.rewrite(url);
  }

  // Per-subdomain robots: thomas.blox.app/robots.txt
  if (pathname === '/robots.txt') {
    const url = req.nextUrl.clone();
    url.pathname = `/subdomain-sitemap/${subdomain}`;
    url.searchParams.set('format', 'robots');
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js internals and static files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot)$).*)'],
};
