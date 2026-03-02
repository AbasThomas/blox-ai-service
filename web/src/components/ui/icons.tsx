import type { SVGProps } from 'react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  AddCircleIcon,
  ArrowLeftDoubleIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  ArrowUpRight01Icon,
  BarChartIcon,
  BotIcon,
  Briefcase01Icon,
  Cancel01Icon,
  ChartUpIcon,
  CheckmarkCircle02Icon,
  Clock03Icon,
  CreditCardIcon,
  DashboardSquare01Icon,
  DateTimeIcon,
  Download01Icon,
  File01Icon,
  Files01Icon,
  GitForkIcon,
  GithubIcon,
  GlobeIcon,
  LayoutGridIcon,
  Link01Icon,
  LinkedinIcon,
  LockIcon,
  Logout01Icon,
  Mail01Icon,
  Menu01Icon,
  Notification01Icon,
  ReceiptDollarIcon,
  ScanIcon,
  Search01Icon,
  Settings02Icon,
  Shield02Icon,
  SparklesIcon,
  StarIcon,
  TransactionHistoryIcon,
  TwitterIcon,
  UserIcon,
  ZapIcon,
} from '@hugeicons/core-free-icons';

type BloxIconProps = Omit<SVGProps<SVGSVGElement>, 'ref'> & {
  size?: string | number;
  strokeWidth?: number;
};

function createIcon(icon: IconSvgElement) {
  const IconComponent = ({ size = 24, strokeWidth = 1.8, color, ...props }: BloxIconProps) => (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      color={typeof color === 'string' ? color : 'currentColor'}
      {...props}
    />
  );

  return IconComponent;
}

export const ArrowRight = createIcon(ArrowRight01Icon);
export const ArrowUpRight = createIcon(ArrowUpRight01Icon);
export const BarChart3 = createIcon(BarChartIcon);
export const Bell = createIcon(Notification01Icon);
export const Bot = createIcon(BotIcon);
export const BriefcaseBusiness = createIcon(Briefcase01Icon);
export const CalendarClock = createIcon(DateTimeIcon);
export const CheckCircle2 = createIcon(CheckmarkCircle02Icon);
export const ChevronRight = createIcon(ArrowRight01Icon);
export const ChevronsLeft = createIcon(ArrowLeftDoubleIcon);
export const ChevronsRight = createIcon(ArrowRightDoubleIcon);
export const Clock = createIcon(Clock03Icon);
export const CreditCard = createIcon(CreditCardIcon);
export const Download = createIcon(Download01Icon);
export const FileStack = createIcon(Files01Icon);
export const FileText = createIcon(File01Icon);
export const GitFork = createIcon(GitForkIcon);
export const Github = createIcon(GithubIcon);
export const Globe = createIcon(GlobeIcon);
export const History = createIcon(TransactionHistoryIcon);
export const LayoutDashboard = createIcon(DashboardSquare01Icon);
export const LayoutTemplate = createIcon(LayoutGridIcon);
export const Link = createIcon(Link01Icon);
export const LinkIcon = Link;
export const Linkedin = createIcon(LinkedinIcon);
export const Lock = createIcon(LockIcon);
export const LogOut = createIcon(Logout01Icon);
export const Mail = createIcon(Mail01Icon);
export const Menu = createIcon(Menu01Icon);
export const PlusCircle = createIcon(AddCircleIcon);
export const Receipt = createIcon(ReceiptDollarIcon);
export const ScanSearch = createIcon(ScanIcon);
export const Search = createIcon(Search01Icon);
export const Settings = createIcon(Settings02Icon);
export const Shield = createIcon(Shield02Icon);
export const Sparkles = createIcon(SparklesIcon);
export const Star = createIcon(StarIcon);
export const TrendingUp = createIcon(ChartUpIcon);
export const Twitter = createIcon(TwitterIcon);
export const User = createIcon(UserIcon);
export const X = createIcon(Cancel01Icon);
export const Zap = createIcon(ZapIcon);
