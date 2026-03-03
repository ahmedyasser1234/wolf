import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));
  app.use(compression());
  app.use(cookieParser());

  // Increase body parser limits for large image uploads
  const { json, urlencoded } = require('express');
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? true
      : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'https://fustanecoomerce.netlify.app'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  await app.listen(process.env.PORT || 3001, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
