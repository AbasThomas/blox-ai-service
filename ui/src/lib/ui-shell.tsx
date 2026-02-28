import { PlanTier } from '@nextjs-blox/shared-types';
import { ReactNode } from 'react';
import { AppFooter } from './app-footer';
import { AppHeader } from './app-header';

interface UiShellProps {
  children: ReactNode;
  tier?: PlanTier;
}

export function UiShell({ children, tier = PlanTier.FREE }: UiShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader tier={tier} />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      <AppFooter />
    </div>
  );
}

