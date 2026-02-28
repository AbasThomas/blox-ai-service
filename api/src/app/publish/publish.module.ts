import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PublishController } from './publish.controller';
import { PublishService } from './publish.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicProfileController } from './public-profile.controller';
import { PublicProfileService } from './public-profile.service';

@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: 'publish' })],
  controllers: [PublishController, PublicProfileController],
  providers: [PublishService, PublicProfileService],
})
export class PublishModule {}

