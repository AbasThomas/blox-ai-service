import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { PortfolioTemplateScaffold } from './shared/PortfolioTemplateScaffold';
import { NIGHTFALL_THEME } from './shared/theme-presets';

interface MinimalTechTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

export function MinimalTechTemplate({ profile, subdomain }: MinimalTechTemplateProps) {
  return <PortfolioTemplateScaffold profile={profile} subdomain={subdomain} theme={NIGHTFALL_THEME} />;
}
