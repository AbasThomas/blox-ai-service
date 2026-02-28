import { Module } from '@nestjs/common';
import { CollaborationController } from './collaboration.controller';
import { CollaborationService } from './collaboration.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../common/mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [CollaborationController],
  providers: [CollaborationService],
})
export class CollaborationModule {}


