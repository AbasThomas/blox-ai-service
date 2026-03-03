'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBloxStore } from '@/lib/store/app-store';
import { LoadingSkeleton } from './loading-skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useBloxStore((state) => state.isAuthenticated);
  const accessToken = useBloxStore((state) => state.accessToken);
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Give the store a moment to hydrate from localStorage
    const timer = setTimeout(() => {
      const hasToken =
        !!accessToken || (typeof window !== 'undefined' && !!localStorage.getItem('blox_access_token'));
      const hasSession = isAuthenticated && hasToken;

      setChecking(false);
      if (!hasSession) {
        router.replace('/login');
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [accessToken, isAuthenticated, router]);

  if (checking) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  const hasToken =
    !!accessToken || (typeof window !== 'undefined' && !!localStorage.getItem('blox_access_token'));

  if (!isAuthenticated || !hasToken) {
    return null;
  }

  return <>{children}</>;
}
