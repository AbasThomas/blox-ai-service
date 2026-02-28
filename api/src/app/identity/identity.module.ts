import { Module } from '@nestjs/common';
import { IdentityResolver } from './identity.resolver';
import { IdentityService } from './identity.service';

@Module({
  providers: [IdentityResolver, IdentityService],
})
export class IdentityModule {}


