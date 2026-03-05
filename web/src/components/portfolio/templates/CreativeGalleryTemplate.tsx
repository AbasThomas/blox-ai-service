import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { PortfolioTemplateScaffold } from './shared/PortfolioTemplateScaffold';
import { SHOWCASE_THEME } from './shared/theme-presets';

interface CreativeGalleryTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

export function CreativeGalleryTemplate({ profile, subdomain }: CreativeGalleryTemplateProps) {
  return <PortfolioTemplateScaffold profile={profile} subdomain={subdomain} theme={SHOWCASE_THEME} />;
}
