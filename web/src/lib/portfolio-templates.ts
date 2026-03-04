export interface PortfolioTemplateOption {
  id: string;
  name: string;
  description: string;
}

export const PORTFOLIO_TEMPLATE_OPTIONS: PortfolioTemplateOption[] = [
  {
    id: 'portfolio-modern-001',
    name: 'Modern Portfolio',
    description: 'Balanced layout for most professionals.',
  },
  {
    id: 'portfolio-freelance-conversion',
    name: 'Freelance Conversion',
    description: 'Service-first layout with stronger contact emphasis.',
  },
  {
    id: 'portfolio-timeline-dev',
    name: 'Developer Timeline',
    description: 'Experience-focused layout with clear project structure.',
  },
  {
    id: 'portfolio-minimal-clean',
    name: 'Minimal Clean',
    description: 'Simple, typography-led portfolio layout.',
  },
  {
    id: 'portfolio-grid-showcase',
    name: 'Grid Showcase',
    description: 'Project-heavy layout for visual portfolios.',
  },
];

export const DEFAULT_PORTFOLIO_TEMPLATE_ID = 'portfolio-modern-001';

export function normalizePortfolioTemplateId(raw: string | undefined | null) {
  const value = (raw ?? '').trim();
  if (!value) return DEFAULT_PORTFOLIO_TEMPLATE_ID;
  const exists = PORTFOLIO_TEMPLATE_OPTIONS.some((item) => item.id === value);
  return exists ? value : DEFAULT_PORTFOLIO_TEMPLATE_ID;
}
