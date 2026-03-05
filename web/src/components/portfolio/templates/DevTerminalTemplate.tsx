import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { PortfolioTemplateScaffold } from './shared/PortfolioTemplateScaffold';
import { DEV_TERMINAL_THEME } from './shared/theme-presets';

interface DevTerminalTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

export function DevTerminalTemplate({ profile, subdomain }: DevTerminalTemplateProps) {
  return <PortfolioTemplateScaffold profile={profile} subdomain={subdomain} theme={DEV_TERMINAL_THEME} />;
}
