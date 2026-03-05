import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { PortfolioTemplateScaffold } from './shared/PortfolioTemplateScaffold';
import { MINIMAL_THEME } from './shared/theme-presets';

interface MinimalTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

export function MinimalTemplate({ profile, subdomain }: MinimalTemplateProps) {
  return <PortfolioTemplateScaffold profile={profile} subdomain={subdomain} theme={MINIMAL_THEME} />;
}
