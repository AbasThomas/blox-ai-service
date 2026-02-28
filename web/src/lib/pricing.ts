import { BillingCycle, PlanTier } from '@nextjs-blox/shared-types';

export interface PricingOption {
  tier: PlanTier;
  cycle: BillingCycle;
  label: string;
  amount: number;
  note: string;
}

export const PRICING_OPTIONS: PricingOption[] = [
  { tier: PlanTier.PRO, cycle: BillingCycle.MONTHLY, label: 'Pro Monthly', amount: 9.99, note: 'Billed monthly' },
  { tier: PlanTier.PRO, cycle: BillingCycle.SEMI_ANNUAL, label: 'Pro 6 Months', amount: 54.99, note: 'Save 10%' },
  { tier: PlanTier.PRO, cycle: BillingCycle.ANNUAL, label: 'Pro Annual', amount: 79, note: 'Save 20%' },
  { tier: PlanTier.PREMIUM, cycle: BillingCycle.MONTHLY, label: 'Premium Monthly', amount: 19.99, note: 'Billed monthly' },
  { tier: PlanTier.PREMIUM, cycle: BillingCycle.SEMI_ANNUAL, label: 'Premium 6 Months', amount: 107.99, note: 'Save 10%' },
  { tier: PlanTier.PREMIUM, cycle: BillingCycle.ANNUAL, label: 'Premium Annual', amount: 199, note: 'Save 20%' },
];

