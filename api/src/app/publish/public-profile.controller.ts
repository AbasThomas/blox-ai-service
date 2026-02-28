import { Controller, Get, Header, NotFoundException, Param } from '@nestjs/common';
import { PublicProfileService } from './public-profile.service';

@Controller('public')
export class PublicProfileController {
  constructor(private readonly publicProfileService: PublicProfileService) {}

  @Get(':subdomain')
  @Header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
  async getBySubdomain(@Param('subdomain') subdomain: string) {
    const profile = await this.publicProfileService.getBySubdomain(subdomain);
    if (!profile) {
      throw new NotFoundException('Public profile not found');
    }
    return profile;
  }
}
