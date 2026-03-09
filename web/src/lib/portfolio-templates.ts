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
  {
    id: 'portfolio-neon-dev',
    name: 'Neon Dev',
    description: 'Cyber terminal aesthetic with vivid neon accents.',
    accent: '#8B5CF6',
    bg: '#050008',
    surface: '#12001B',
    text: '#DDD6FE',
    layout: 'timeline',
    tags: ['dark', 'neon', 'developer'],
  },
  {
    id: 'portfolio-glass-dev',
    name: 'Glass Dev',
    description: 'Soft glassmorphism UI with polished engineering sections.',
    accent: '#6366F1',
    bg: '#020617',
    surface: '#0F172A',
    text: '#E2E8F0',
    layout: 'split-hero',
    tags: ['dark', 'glass', 'developer'],
  },
  {
    id: 'portfolio-studio-designer',
    name: 'Studio Designer',
    description: 'Editorial designer portfolio with premium case-study flow.',
    accent: '#A855F7',
    bg: '#080812',
    surface: '#0F0F1A',
    text: '#F5D0FE',
    layout: 'grid-showcase',
    tags: ['dark', 'designer', 'case-study'],
  },
  {
    id: 'portfolio-canvas-designer',
    name: 'Canvas Designer',
    description: 'Warm creative canvas for visual storytelling portfolios.',
    accent: '#F97316',
    bg: '#FFF7ED',
    surface: '#FFFFFF',
    text: '#9A3412',
    layout: 'centered-cta',
    tags: ['light', 'designer', 'creative'],
  },
  {
    id: 'portfolio-garden-studio',
    name: 'Garden Studio',
    description: 'Dark botanical aesthetic with pixel flowers, serif type and pink accents.',
    accent: '#ec4899',
    bg: '#051a1a',
    surface: '#0a2a2a',
    text: '#f8fafc',
    layout: 'centered-cta',
    tags: ['dark', 'designer', 'creative', 'minimal', 'botanical'],
  },
  {
    id: 'portfolio-arcade',
    name: 'Arcade HUD',
    description: 'Retro space-shooter aesthetic with pixel art, scanlines and full HUD layout.',
    accent: '#00ff41',
    bg: '#050505',
    surface: '#0d0d0d',
    text: '#FFFFFF',
    layout: 'timeline',
    tags: ['dark', 'retro', 'arcade', 'pixel', 'developer'],
  },
  {
    id: 'portfolio-bento-studio',
    name: 'Bento Studio',
    description: 'Clean bento-grid portfolio for photographers and visual designers.',
    accent: '#171717',
    bg: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#171717',
    layout: 'grid-showcase',
    tags: ['light', 'minimal', 'designer', 'photographer'],
  },
  {
    id: 'portfolio-cinematic',
    name: 'Cinematic',
    description: 'Dark film-production aesthetic with video hero, marquee, bento services grid and masonry gallery.',
    accent: '#dc2626',
    bg: '#050505',
    surface: '#080808',
    text: '#e5e5e5',
    layout: 'grid-showcase',
    tags: ['dark', 'cinematic', 'creative', 'filmmaker', 'designer', 'bold'],
  },
  {
    id: 'portfolio-macos',
    name: 'macOS Desktop',
    description: 'Interactive macOS Ventura-style portfolio with draggable windows and dock.',
    accent: '#007aff',
    bg: '#1d3461',
    surface: '#ffffff',
    text: '#1e293b',
    layout: 'grid-showcase',
    tags: ['light', 'interactive', 'creative', 'unique', 'developer'],
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
