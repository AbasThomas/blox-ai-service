import { BillingCycle, PlanTier, PricingPlan } from '@nextjs-blox/shared-types';

export const BLOX_PRICING: PricingPlan[] = [
  {
    tier: PlanTier.PRO,
    cycle: BillingCycle.MONTHLY,
    amountUsd: 9.99,
    display: '$9.99/mo',
    discountPct: 0,
    isTrialEligible: true,
  },
  {
    tier: PlanTier.PRO,
    cycle: BillingCycle.SEMI_ANNUAL,
    amountUsd: 54.99,
    display: '$54.99/6mo',
    discountPct: 10,
    isTrialEligible: true,
  },
  {
    tier: PlanTier.PRO,
    cycle: BillingCycle.ANNUAL,
    amountUsd: 79,
    display: '$79/yr',
    discountPct: 20,
    isTrialEligible: true,
  },
  {
    tier: PlanTier.PREMIUM,
    cycle: BillingCycle.MONTHLY,
    amountUsd: 19.99,
    display: '$19.99/mo',
    discountPct: 0,
    isTrialEligible: true,
  },
  {
    tier: PlanTier.PREMIUM,
    cycle: BillingCycle.SEMI_ANNUAL,
    amountUsd: 107.99,
    display: '$107.99/6mo',
    discountPct: 10,
    isTrialEligible: true,
  },
  {
    tier: PlanTier.PREMIUM,
    cycle: BillingCycle.ANNUAL,
    amountUsd: 199,
    display: '$199/yr',
    discountPct: 20,
    isTrialEligible: true,
  },
];

