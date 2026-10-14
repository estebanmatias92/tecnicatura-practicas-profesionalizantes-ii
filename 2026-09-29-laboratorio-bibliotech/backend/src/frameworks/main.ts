// Frameworks — bootstrap NestJS. ValidationPipe global (DTOs, whitelist);
// prefijo no usado: las rutas ya coinciden con api/openapi.yaml.
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './nest/app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173' });
  const port = Number(process.env['PORT'] ?? '3000');
  await app.listen(port);
  console.log(`BiblioTech API en :${port}`);
}

void bootstrap();
