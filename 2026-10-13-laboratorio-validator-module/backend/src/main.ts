import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createValidationPipe } from './validation-pipe';
import { setLanguage } from './model/messages';

async function bootstrap(): Promise<void> {
  // Set the language before creating any Nest module so the whole process
  // uses a single locale. Fails fast on invalid APP_LANGUAGE values.
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  if (!setLanguage(config.get<string>('APP_LANGUAGE') ?? 'es')) {
    throw new Error(
      `APP_LANGUAGE inválido: ${config.get<string>('APP_LANGUAGE') ?? 'es'} (valores soportados: es, en)`,
    );
  }

  app.setGlobalPrefix('api');
  app.useGlobalPipes(createValidationPipe());

  const corsOrigin = config.get<string>('CORS_ORIGIN');
  if (corsOrigin) {
    app.enableCors({ origin: corsOrigin.split(',').map((origin) => origin.trim()) });
  }
  app.enableShutdownHooks();

  const port = Number(config.get<string>('PORT') ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`BiblioTech API escuchando en el puerto ${port}`, 'Bootstrap');
}

void bootstrap();
