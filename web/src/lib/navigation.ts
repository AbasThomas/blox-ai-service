import { LayoutDashboard, FileStack, LayoutTemplate, Activity, Settings } from 'lucide-react';

export const SIDEBAR_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/assets', label: 'Assets', icon: FileStack },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/analytics', label: 'Analytics', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const QUICK_ACTIONS = [
  { href: '/portfolios/new', label: 'New Portfolio' },
  { href: '/resumes/new', label: 'New Resume' },
  { href: '/cover-letters/new', label: 'New Cover Letter' },
];

