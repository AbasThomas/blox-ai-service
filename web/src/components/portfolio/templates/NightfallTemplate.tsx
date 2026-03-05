import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { PortfolioTemplateScaffold } from './shared/PortfolioTemplateScaffold';
import { NIGHTFALL_THEME } from './shared/theme-presets';

interface NightfallTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

export function NightfallTemplate({ profile, subdomain }: NightfallTemplateProps) {
  return <PortfolioTemplateScaffold profile={profile} subdomain={subdomain} theme={NIGHTFALL_THEME} />;
}
