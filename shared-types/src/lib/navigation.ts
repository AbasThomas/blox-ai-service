import { PlanTier } from './enums';

export interface NavigationItem {
  label: string;
  href: string;
  minTier?: PlanTier;
}

export const APP_NAVIGATION: NavigationItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Assets', href: '/portfolios/new' },
  { label: 'Templates', href: '/templates' },
  { label: 'Analytics', href: '/analytics/demo' },
  { label: 'Settings', href: '/settings' },
];

