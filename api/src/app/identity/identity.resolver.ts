import { Args, Query, Resolver } from '@nestjs/graphql';
import { IdentityService } from './identity.service';
import { PublicIdentity } from './identity.types';

@Resolver(() => PublicIdentity)
export class IdentityResolver {
  constructor(private readonly identityService: IdentityService) {}

  @Query(() => PublicIdentity)
  publicIdentity(@Args('userId') userId: string) {
    return this.identityService.getPublicIdentity(userId);
  }
}


