import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envValidationSchema } from './config/env.validation';
import { ControllerModule } from './controller/controller.module';
import { DomainExceptionFilter } from './controller/filters/domain-exception.filter';
import { MulterExceptionFilter } from './controller/filters/multer-exception.filter';
import { JwtAuthGuard } from './controller/guards/jwt-auth.guard';
import { RolesGuard } from './controller/guards/roles.guard';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { buildDataSourceOptions } from './infrastructure/persistence/data-source-options';
import { ModelModule } from './model/model.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildDataSourceOptions({
          host: config.getOrThrow<string>('DB_HOST'),
          port: Number(config.get<string>('DB_PORT') ?? 3306),
          username: config.getOrThrow<string>('DB_USER'),
          password: config.getOrThrow<string>('DB_PASSWORD'),
          database: config.getOrThrow<string>('DB_NAME'),
          logging: config.get<string>('DB_LOGGING') === 'true',
        }),
    }),
    InfrastructureModule,
    ModelModule,
    ControllerModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: APP_FILTER, useClass: MulterExceptionFilter },
  ],
})
export class AppModule {}
