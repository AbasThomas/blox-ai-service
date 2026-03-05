import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { normalizePortfolioTemplateId } from '@/lib/portfolio-templates';
import { CanvasDesignerTemplate } from './CanvasDesignerTemplate';
import { DevTerminalTemplate } from './DevTerminalTemplate';
import { FreelanceTemplate } from './FreelanceTemplate';
import { GlassDevTemplate } from './GlassDevTemplate';
import { MinimalTemplate } from './MinimalTemplate';
import { NeonDevTemplate } from './NeonDevTemplate';
import { NightfallTemplate } from './NightfallTemplate';
import { ShowcaseTemplate } from './ShowcaseTemplate';
import { StudioDesignerTemplate } from './StudioDesignerTemplate';

interface PortfolioTemplateRendererProps {
  profile: PublicProfilePayload;
  subdomain: string;
  templateId?: string;
}

export function PortfolioTemplateRenderer({
  profile,
  subdomain,
  templateId,
}: PortfolioTemplateRendererProps) {
  const activeTemplateId = normalizePortfolioTemplateId(templateId ?? profile.templateId);

  switch (activeTemplateId) {
    case 'portfolio-neon-dev':
      return <NeonDevTemplate profile={profile} subdomain={subdomain} />;
    case 'portfolio-glass-dev':
      return <GlassDevTemplate profile={profile} subdomain={subdomain} />;
    case 'portfolio-studio-designer':
      return <StudioDesignerTemplate profile={profile} subdomain={subdomain} />;
    case 'portfolio-canvas-designer':
      return <CanvasDesignerTemplate profile={profile} subdomain={subdomain} />;
    case 'portfolio-freelance-conversion':
      return <FreelanceTemplate profile={profile} subdomain={subdomain} />;
    case 'portfolio-timeline-dev':
      return <DevTerminalTemplate profile={profile} subdomain={subdomain} />;
    case 'portfolio-minimal-clean':
      return <MinimalTemplate profile={profile} subdomain={subdomain} />;
    case 'portfolio-grid-showcase':
      return <ShowcaseTemplate profile={profile} subdomain={subdomain} />;
    case 'portfolio-modern-001':
    default:
      return <NightfallTemplate profile={profile} subdomain={subdomain} />;
  }
}
