'use client';

import dynamic from 'next/dynamic';

const PosthogBoot = dynamic(
  () => import('./posthog-boot').then((module) => module.PosthogBoot),
  { ssr: false },
);

export function PosthogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PosthogBoot />
    </>
  );
}

