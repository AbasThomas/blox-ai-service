import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AssetGenerateProcessor } from './processors/asset-generate.processor';
import { ImportUnifyProcessor } from './processors/import-unify.processor';
import { PublishProcessor } from './processors/publish.processor';
import { ExportProcessor } from './processors/export.processor';
import { BillingNotifyProcessor } from './processors/billing-notify.processor';
import { AssetCritiqueProcessor } from './processors/asset-critique.processor';
import { AtsScanProcessor } from './processors/ats-scan.processor';
import { SeoAuditProcessor } from './processors/seo-audit.processor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
      }),
    }),
    BullModule.registerQueue(
      { name: 'import-unify' },
      { name: 'asset-generate' },
      { name: 'asset-duplicate' },
      { name: 'asset-critique' },
      { name: 'seo-audit' },
      { name: 'ats-scan' },
      { name: 'translation' },
      { name: 'media-process' },
      { name: 'publish' },
      { name: 'export' },
      { name: 'billing-notify' },
    ),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ImportUnifyProcessor,
    AssetGenerateProcessor,
    PublishProcessor,
    ExportProcessor,
    BillingNotifyProcessor,
    AssetCritiqueProcessor,
    AtsScanProcessor,
    SeoAuditProcessor,
  ],
})
export class AppModule {}

