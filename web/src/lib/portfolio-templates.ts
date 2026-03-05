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
    name: 'Nightfall Modern',
    description: 'Balanced hero layout with dark modern visuals.',
    accent: '#1ECEFA',
    bg: '#0C0F13',
    surface: '#131A23',
    text: '#E2E8F0',
    layout: 'split-hero',
    tags: ['dark', 'balanced', 'professional'],
  },
  {
    id: 'portfolio-freelance-conversion',
    name: 'Freelance Conversion',
    description: 'Service-first layout with strong contact conversion.',
    accent: '#F59E0B',
    bg: '#0F0D0A',
    surface: '#1A1610',
    text: '#FEF3C7',
    layout: 'centered-cta',
    tags: ['dark', 'warm', 'cta-focused'],
  },
  {
    id: 'portfolio-timeline-dev',
    name: 'Dev Terminal',
    description: 'Technical layout tuned for engineering portfolios.',
    accent: '#22C55E',
    bg: '#060E06',
    surface: '#0D160D',
    text: '#BBF7D0',
    layout: 'timeline',
    tags: ['dark', 'technical', 'timeline'],
  },
  {
    id: 'portfolio-minimal-clean',
    name: 'Minimal Editorial',
    description: 'Clean typography-led layout with adaptive theme support.',
    accent: '#6366F1',
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#1E1B4B',
    layout: 'minimal',
    tags: ['light', 'minimal', 'typography'],
  },
  {
    id: 'portfolio-grid-showcase',
    name: 'Creative Gallery',
    description: 'Project-first layout with gallery-centric storytelling.',
    accent: '#FBBF24',
    bg: '#4A0916',
    surface: '#611126',
    text: '#FFE4E6',
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
