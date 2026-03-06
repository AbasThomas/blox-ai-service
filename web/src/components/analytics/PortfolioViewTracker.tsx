'use client';

/**
 * PortfolioViewTracker — renders nothing, runs in the browser only.
 *
 * On mount:
 *  • Records a portfolio_view event to PostHog (with subdomain + referrer)
 *  • Fires the backend /v1/analytics/track endpoint (best-effort, anonymized)
 *  • Attaches a document-level click listener that captures external link clicks
 *    as portfolio_link_click events to PostHog
 */

import { useEffect } from 'react';

interface PortfolioViewTrackerProps {
  subdomain: string;
  portfolioTitle: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333';

async function sendTrackEvent(payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${API_BASE}/v1/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true, // works with sendBeacon-style requests
    });
  } catch {
    // silently fail — tracking must never break the portfolio
  }
}

export function PortfolioViewTracker({ subdomain, portfolioTitle }: PortfolioViewTrackerProps) {
  useEffect(() => {
    const referrer = document.referrer ? new URL(document.referrer).hostname : 'direct';
    const pageUrl = window.location.href;

    // Fire PostHog event
    void import('posthog-js').then(({ default: posthog }) => {
      posthog.capture('portfolio_view', {
        subdomain,
        portfolio_title: portfolioTitle,
        referrer,
        url: pageUrl,
        $current_url: pageUrl,
      });
    }).catch(() => undefined);

    // Fire backend tracking (anonymized — no PII)
    void sendTrackEvent({
      event: 'portfolio_view',
      subdomain,
      referrer,
      url: pageUrl,
      timestamp: new Date().toISOString(),
    });

    // Track all external link clicks on the page
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href') ?? '';
      const isExternal =
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        anchor.target === '_blank';

      if (!isExternal) return;

      const label =
        anchor.textContent?.trim().slice(0, 80) ||
        anchor.getAttribute('aria-label') ||
        new URL(href, window.location.href).hostname;

      void import('posthog-js').then(({ default: posthog }) => {
        posthog.capture('portfolio_link_click', {
          subdomain,
          href,
          link_label: label,
          referrer,
        });
      }).catch(() => undefined);

      void sendTrackEvent({
        event: 'portfolio_link_click',
        subdomain,
        href,
        link_label: label,
        timestamp: new Date().toISOString(),
      });
    };

    document.addEventListener('click', handleClick, { passive: true });
    return () => document.removeEventListener('click', handleClick);
  }, [subdomain, portfolioTitle]);

  return null;
}
