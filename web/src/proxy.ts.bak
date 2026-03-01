import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isReservedSubdomain } from './lib/subdomains';

const APP_HOST = (() => {
  const raw = process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'https://blox.app';
  try {
    return new URL(raw).host;
  } catch {
    return raw.replace(/https?:\/\//, '').replace(/\/.*$/, '');
  }
})();

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const hostname = host.split(':')[0];

  if (hostname.endsWith(APP_HOST) && hostname !== APP_HOST && hostname !== `www.${APP_HOST}`) {
    const subdomain = hostname.replace(`.${APP_HOST}`, '');
    if (isReservedSubdomain(subdomain)) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();

    if (url.pathname === '/') {
      url.pathname = `/${subdomain}`;
      return NextResponse.rewrite(url);
    }

    if (url.pathname === '/sitemap.xml') {
      url.pathname = `/subdomain-sitemap/${subdomain}`;
      return NextResponse.rewrite(url);
    }

    if (url.pathname === '/robots.txt') {
      url.pathname = `/subdomain-sitemap/${subdomain}`;
      url.searchParams.set('format', 'robots');
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js).*)'],
};

