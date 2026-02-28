import { PlanTier } from '@nextjs-blox/shared-types';

interface TierChipProps {
  tier: PlanTier;
}

export function TierChip({ tier }: TierChipProps) {
  const tone =
    tier === PlanTier.ENTERPRISE
      ? 'bg-slate-900 text-white'
      : tier === PlanTier.PREMIUM
      ? 'bg-amber-500 text-slate-900'
      : tier === PlanTier.PRO
      ? 'bg-cyan-500 text-slate-900'
      : 'bg-slate-200 text-slate-800';

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {tier}
    </span>
  );
}

