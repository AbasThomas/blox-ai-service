import Link from 'next/link';
import { PlanTier } from '@nextjs-blox/shared-types';
import { TierChip } from './tier-chip';

interface AppHeaderProps {
  tier?: PlanTier;
}

export function AppHeader({ tier = PlanTier.FREE }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-black tracking-tight text-slate-900">
          BLOX
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-slate-700 md:flex">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/templates">Templates</Link>
          <Link href="/analytics/demo">Analytics</Link>
          <Link href="/settings">Settings</Link>
        </nav>
        <div className="flex items-center gap-3">
          <TierChip tier={tier} />
          <Link
            href="/checkout"
            className="rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white"
          >
            Upgrade
          </Link>
        </div>
      </div>
    </header>
  );
}

