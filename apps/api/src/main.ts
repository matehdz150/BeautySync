import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import 'reflect-metadata';
import { ensureBookingConstraints } from './modules/db/setupConstraints';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await ensureBookingConstraints();

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // main.ts o app.module.ts

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(cookieParser());

  await app.listen(8000);
}
bootstrap();
