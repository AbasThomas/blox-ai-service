import type { SVGProps } from 'react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Activity as ActivityIcon,
  AddCircleIcon,
  ArrowLeftDoubleIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  ArrowUpRight01Icon,
  BarChartIcon,
  BotIcon,
  Briefcase01Icon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  Cancel01Icon,
  ChartUpIcon,
  CheckmarkCircle02Icon,
  Clock3 as Clock3Icon,
  Clock03Icon,
  CreditCardIcon,
  Database as DatabaseIcon,
  DashboardSquare01Icon,
  DateTimeIcon,
  DollarSign as DollarSignIcon,
  Download01Icon,
  ExternalLink as ExternalLinkIcon,
  File01Icon,
  Files01Icon,
  GitForkIcon,
  GithubIcon,
  GoogleIcon,
  GlobeIcon,
  LayoutGridIcon,
  Link01Icon,
  LinkedinIcon,
  LockIcon,
  Logout01Icon,
  Mail01Icon,
  MapPin as MapPinIcon,
  MessageSquare as MessageSquareIcon,
  Menu01Icon,
  Mic as MicIcon,
  Minus as MinusIcon,
  MousePointer2 as MousePointer2Icon,
  MousePointerClick as MousePointerClickIcon,
  Notification01Icon,
  Play as PlayIcon,
  Plus as PlusIcon,
  ReceiptDollarIcon,
  Filter as FilterIcon,
  RotateCcw as RotateCcwIcon,
  Square as SquareIcon,
  Target as TargetIcon,
  Milestone as MilestoneIcon,
  GraduationCap as GraduationCapIcon,
  ScanIcon,
  Search01Icon,
  Send as SendIcon,
  Settings02Icon,
  ShieldCheck as ShieldCheckIcon,
  Shield02Icon,
  SidebarLeftIcon,
  SidebarRightIcon,
  SparklesIcon,
  StarIcon,
  TransactionHistoryIcon,
  TwitterIcon,
  UserIcon,
  UserPlus as UserPlusIcon,
  Users as UsersIcon,
  Video as VideoIcon,
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
export const Activity = createIcon(ActivityIcon);
export const BarChart3 = createIcon(BarChartIcon);
export const Bell = createIcon(Notification01Icon);
export const Bot = createIcon(BotIcon);
export const BriefcaseBusiness = createIcon(Briefcase01Icon);
export const CalendarClock = createIcon(DateTimeIcon);
export const Check = createIcon(CheckIcon);
export const CheckCircle = createIcon(CheckCircleIcon);
export const CheckCircle2 = createIcon(CheckmarkCircle02Icon);
export const ChevronRight = createIcon(ArrowRight01Icon);
export const ChevronsLeft = createIcon(ArrowLeftDoubleIcon);
export const ChevronsRight = createIcon(ArrowRightDoubleIcon);
export const Clock = createIcon(Clock03Icon);
export const Clock3 = createIcon(Clock3Icon);
export const CreditCard = createIcon(CreditCardIcon);
export const Database = createIcon(DatabaseIcon);
export const Download = createIcon(Download01Icon);
export const DollarSign = createIcon(DollarSignIcon);
export const ExternalLink = createIcon(ExternalLinkIcon);
export const FileStack = createIcon(Files01Icon);
export const FileText = createIcon(File01Icon);
export const GitFork = createIcon(GitForkIcon);
export const Github = createIcon(GithubIcon);
export const Google = createIcon(GoogleIcon);
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
export const MapPin = createIcon(MapPinIcon);
export const MessageSquare = createIcon(MessageSquareIcon);
export const Menu = createIcon(Menu01Icon);
export const Mic = createIcon(MicIcon);
export const Minus = createIcon(MinusIcon);
export const MousePointer2 = createIcon(MousePointer2Icon);
export const MousePointerClick = createIcon(MousePointerClickIcon);
export const Play = createIcon(PlayIcon);
export const Plus = createIcon(PlusIcon);
export const PlusCircle = createIcon(AddCircleIcon);
export const Receipt = createIcon(ReceiptDollarIcon);
export const Filter = createIcon(FilterIcon);
export const RotateCcw = createIcon(RotateCcwIcon);
export const Square = createIcon(SquareIcon);
export const Target = createIcon(TargetIcon);
export const Milestone = createIcon(MilestoneIcon);
export const GraduationCap = createIcon(GraduationCapIcon);
export const ScanSearch = createIcon(ScanIcon);
export const Search = createIcon(Search01Icon);
export const Send = createIcon(SendIcon);
export const Settings = createIcon(Settings02Icon);
export const ShieldCheck = createIcon(ShieldCheckIcon);
export const Shield = createIcon(Shield02Icon);
export const SidebarLeft = createIcon(SidebarLeftIcon);
export const SidebarRight = createIcon(SidebarRightIcon);
export const Sparkles = createIcon(SparklesIcon);
export const Star = createIcon(StarIcon);
export const TrendingUp = createIcon(ChartUpIcon);
export const Twitter = createIcon(TwitterIcon);
export const User = createIcon(UserIcon);
export const UserPlus = createIcon(UserPlusIcon);
export const Users = createIcon(UsersIcon);
export const Video = createIcon(VideoIcon);
export const X = createIcon(Cancel01Icon);
export const Zap = createIcon(ZapIcon);
