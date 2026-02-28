import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
  });

  const port = process.env.REALTIME_PORT || 3335;
  await app.listen(port);
  Logger.log(`Blox realtime service on http://localhost:${port}`);
}

bootstrap();

