import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: 'import-unify' })],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
