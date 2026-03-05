import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { PortfolioTemplateScaffold } from './shared/PortfolioTemplateScaffold';
import { SHOWCASE_THEME } from './shared/theme-presets';

interface ShowcaseTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

export function ShowcaseTemplate({ profile, subdomain }: ShowcaseTemplateProps) {
  return <PortfolioTemplateScaffold profile={profile} subdomain={subdomain} theme={SHOWCASE_THEME} />;
}
