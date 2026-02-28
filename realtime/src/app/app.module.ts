import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CollabGateway } from './collab/collab.gateway';
import { CollabService } from './collab/collab.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, CollabGateway, CollabService],
})
export class AppModule {}

