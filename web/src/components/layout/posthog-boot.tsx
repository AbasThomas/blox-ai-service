'use client';

import { useEffect } from 'react';

export function PosthogBoot() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!key) return;

    let cancelled = false;

    void import('posthog-js')
      .then(({ default: posthog }) => {
        if (cancelled) return;
        posthog.init(key, {
          api_host: host,
          capture_pageview: true,
          persistence: 'localStorage',
          autocapture: false,
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
