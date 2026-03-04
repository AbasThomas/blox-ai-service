export interface PortfolioTemplateOption {
  id: string;
  name: string;
  description: string;
  accent: string;
  bg: string;
  surface: string;
  text: string;
  layout: 'split-hero' | 'centered-cta' | 'timeline' | 'minimal' | 'grid-showcase';
  tags: string[];
}

export const PORTFOLIO_TEMPLATE_OPTIONS: PortfolioTemplateOption[] = [
  {
    id: 'portfolio-modern-001',
    name: 'Modern',
    description: 'Balanced split-hero layout for most professionals.',
    accent: '#1ECEFA',
    bg: '#0C0F13',
    surface: '#131A23',
    text: '#E2E8F0',
    layout: 'split-hero',
    tags: ['dark', 'balanced', 'professional'],
  },
  {
    id: 'portfolio-freelance-conversion',
    name: 'Freelance',
    description: 'Service-first layout with a strong CTA and contact emphasis.',
    accent: '#F59E0B',
    bg: '#0F0D0A',
    surface: '#1A1610',
    text: '#FEF3C7',
    layout: 'centered-cta',
    tags: ['dark', 'warm', 'cta-focused'],
  },
  {
    id: 'portfolio-timeline-dev',
    name: 'Developer',
    description: 'Terminal-inspired, experience-focused timeline layout.',
    accent: '#22C55E',
    bg: '#060E06',
    surface: '#0D160D',
    text: '#BBF7D0',
    layout: 'timeline',
    tags: ['dark', 'technical', 'timeline'],
  },
  {
    id: 'portfolio-minimal-clean',
    name: 'Minimal',
    description: 'Light, typography-led layout with generous whitespace.',
    accent: '#6366F1',
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#1E1B4B',
    layout: 'minimal',
    tags: ['light', 'minimal', 'typography'],
  },
  {
    id: 'portfolio-grid-showcase',
    name: 'Showcase',
    description: 'Project-heavy layout with a bold visual grid.',
    accent: '#A855F7',
    bg: '#09050F',
    surface: '#130D1C',
    text: '#E9D5FF',
    layout: 'grid-showcase',
    tags: ['dark', 'bold', 'grid'],
  },
];

export const DEFAULT_PORTFOLIO_TEMPLATE_ID = 'portfolio-modern-001';

export function normalizePortfolioTemplateId(raw: string | undefined | null) {
  const value = (raw ?? '').trim();
  if (!value) return DEFAULT_PORTFOLIO_TEMPLATE_ID;
  const exists = PORTFOLIO_TEMPLATE_OPTIONS.some((item) => item.id === value);
  return exists ? value : DEFAULT_PORTFOLIO_TEMPLATE_ID;
}

export function getTemplateById(id: string): PortfolioTemplateOption {
  return (
    PORTFOLIO_TEMPLATE_OPTIONS.find((t) => t.id === id) ??
    PORTFOLIO_TEMPLATE_OPTIONS[0]
  );
}
