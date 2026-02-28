'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

export function PosthogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (key) {
      posthog.init(key, {
        api_host: host,
        capture_pageview: true,
        persistence: 'localStorage',
        autocapture: false,
      });
    }
  }, []);

  return <>{children}</>;
}

