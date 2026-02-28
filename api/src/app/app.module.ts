import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { MailModule } from './common/mail/mail.module';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AssetsModule } from './assets/assets.module';
import { BillingModule } from './billing/billing.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PublishModule } from './publish/publish.module';
import { IdentityModule } from './identity/identity.module';
import { QueuesModule } from './queues/queues.module';
import { TemplatesModule } from './templates/templates.module';
import { ScannerModule } from './scanner/scanner.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    BullModule.forRootAsync({
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
        return {
          connection: {
            url: redisUrl,
          },
        };
      },
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URL ?? 'mongodb://localhost:27017/blox',
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      path: '/graphql',
      autoSchemaFile: true,
      playground: false,
      introspection: true,
    }),
    MailModule,
    HealthModule,
    PrismaModule,
    AuthModule,
    AssetsModule,
    BillingModule,
    IntegrationsModule,
    AnalyticsModule,
    PublishModule,
    IdentityModule,
    QueuesModule,
    TemplatesModule,
    ScannerModule,
    CollaborationModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


