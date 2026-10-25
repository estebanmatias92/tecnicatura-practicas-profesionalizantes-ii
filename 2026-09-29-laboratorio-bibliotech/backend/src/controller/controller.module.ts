import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ModelModule } from '../model/model.module';
import { AuthController } from './auth.controller';
import { HealthController } from './health.controller';
import { MaterialsController } from './materials.controller';
import { UsersController } from './users.controller';

@Module({
  imports: [
    ModelModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: memoryStorage(),
        limits: {
          fileSize: Number(config.get<string>('MAX_FILE_SIZE_MB') ?? 50) * 1024 * 1024,
        },
      }),
    }),
  ],
  controllers: [AuthController, UsersController, MaterialsController, HealthController],
})
export class ControllerModule {}
