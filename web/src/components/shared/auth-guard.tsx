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
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Give the store a moment to hydrate from localStorage
    const timer = setTimeout(() => {
      setChecking(false);
      if (!isAuthenticated) {
        router.replace('/login');
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  if (checking) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
