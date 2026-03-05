import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { PortfolioTemplateScaffold } from './shared/PortfolioTemplateScaffold';
import { FREELANCE_THEME } from './shared/theme-presets';

interface FreelanceTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

export function FreelanceTemplate({ profile, subdomain }: FreelanceTemplateProps) {
  return <PortfolioTemplateScaffold profile={profile} subdomain={subdomain} theme={FREELANCE_THEME} />;
}
