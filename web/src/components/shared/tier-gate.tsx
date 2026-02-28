'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { PlanTier } from '@nextjs-blox/shared-types';
import { useBloxStore } from '../../lib/store/app-store';

const rank: Record<PlanTier, number> = {
  [PlanTier.FREE]: 0,
  [PlanTier.PRO]: 1,
  [PlanTier.PREMIUM]: 2,
  [PlanTier.ENTERPRISE]: 3,
};

interface TierGateProps {
  minTier?: PlanTier;
  children: ReactNode;
}

export function TierGate({ minTier, children }: TierGateProps) {
  const pathname = usePathname();
  const userTier = useBloxStore((state) => state.user.tier);
  const setLastVisitedRoute = useBloxStore((state) => state.setLastVisitedRoute);

  useEffect(() => {
    setLastVisitedRoute(pathname);
  }, [pathname, setLastVisitedRoute]);

  if (!minTier || rank[userTier] >= rank[minTier]) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
      <h2 className="text-xl font-bold text-amber-900">Feature requires {minTier}</h2>
      <p className="mt-2 text-sm text-amber-800">
        Upgrade to unlock this workflow and continue without limits.
      </p>
      <a
        href="/checkout"
        className="mt-4 inline-flex rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900"
      >
        View plans
      </a>
    </div>
  );
}

