import {
  LayoutDashboard,
  BriefcaseBusiness,
  FileText,
  Mail,
  ShieldCheck,
  LayoutTemplate,
  Activity,
  Receipt,
  Settings,
} from '@/components/ui/icons';

export const SIDEBAR_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/portfolios', label: 'Portfolios', icon: BriefcaseBusiness },
  { href: '/resumes', label: 'Resumes & CVs', icon: FileText },
  { href: '/cover-letters', label: 'Cover Letters', icon: Mail },
  { href: '/templates', label: 'Templates & Tools', icon: LayoutTemplate },
  { href: '/accounts', label: 'Connected Accounts', icon: ShieldCheck },
  { href: '/analytics', label: 'Analytics', icon: Activity },
  { href: '/billing', label: 'Billing & Invoices', icon: Receipt },
  { href: '/settings', label: 'Settings & Career', icon: Settings },
];

export const QUICK_ACTIONS = [
  { href: '/portfolios/new', label: 'New Portfolio' },
  { href: '/resumes/new', label: 'New Resume' },
  { href: '/cover-letters/new', label: 'New Cover Letter' },
  { href: '/billing', label: 'View Invoices' },
];
