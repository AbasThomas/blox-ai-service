import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { HttpExceptionFilter } from './app/common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'v1';

  app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' }));
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger docs
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Blox API')
      .setDescription('AI-powered portfolio & resume platform API')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
      .addTag('auth', 'Authentication & MFA')
      .addTag('assets', 'Portfolio, Resume & Cover Letter management')
      .addTag('billing', 'Subscriptions & Payments (Paystack)')
      .addTag('templates', 'Template library & marketplace')
      .addTag('scanner', 'ATS & Job Match scanner')
      .addTag('analytics', 'Asset analytics & link tracking')
      .addTag('publish', 'Asset publishing & subdomain management')
      .addTag('collaboration', 'Comments & collaboration')
      .addTag('integrations', 'OAuth integrations (LinkedIn, GitHub, etc.)')
      .addTag('admin', 'Admin panel (Enterprise only)')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    Logger.log(`Swagger docs: http://localhost:${process.env.PORT || 3333}/docs`);
  }

  const port = process.env.PORT || 3333;
  await app.listen(port);
  Logger.log(`Blox API running on http://localhost:${port}/${globalPrefix}`);
}

bootstrap();


