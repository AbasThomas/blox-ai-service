import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { PortfolioTemplateScaffold } from './shared/PortfolioTemplateScaffold';
import { FREELANCE_THEME } from './shared/theme-presets';

interface ExecutiveElegantTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

export function ExecutiveElegantTemplate({ profile, subdomain }: ExecutiveElegantTemplateProps) {
  return <PortfolioTemplateScaffold profile={profile} subdomain={subdomain} theme={FREELANCE_THEME} />;
}
