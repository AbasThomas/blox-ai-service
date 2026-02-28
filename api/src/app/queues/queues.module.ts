import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueuesController } from './queues.controller';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'import-unify' },
      { name: 'asset-generate' },
      { name: 'asset-duplicate' },
      { name: 'asset-critique' },
      { name: 'seo-audit' },
      { name: 'ats-scan' },
      { name: 'translation' },
      { name: 'publish' },
      { name: 'export' },
    ),
  ],
  controllers: [QueuesController],
})
export class QueuesModule {}


