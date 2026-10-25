import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CLOCK, type Clock } from './repositories/clock';
import { FILE_STORAGE, type FileStorage } from './repositories/file-storage';
import { MATERIAL_REPOSITORY, type MaterialRepository } from './repositories/material.repository';
import { MODEL_CONFIG, type ModelConfig } from './repositories/model-config';
import { PASSWORD_HASHER, type PasswordHasher } from './repositories/password-hasher';
import { TOKEN_SERVICE, type TokenService } from './repositories/token-service';
import { USER_REPOSITORY, type UserRepository } from './repositories/user.repository';
import { AuthService } from './services/auth.service';
import { MaterialService } from './services/material.service';
import { UserService } from './services/user.service';

@Module({
  providers: [
    {
      provide: MODEL_CONFIG,
      useFactory: (config: ConfigService): ModelConfig => ({
        maxFileSizeBytes:
          Number(config.get<string>('MAX_FILE_SIZE_MB') ?? 50) * 1024 * 1024,
      }),
      inject: [ConfigService],
    },
    {
      provide: AuthService,
      useFactory: (
        users: UserRepository,
        hasher: PasswordHasher,
        tokens: TokenService,
        clock: Clock,
      ) => new AuthService(users, hasher, tokens, clock),
      inject: [USER_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE, CLOCK],
    },
    {
      provide: UserService,
      useFactory: (users: UserRepository, hasher: PasswordHasher, clock: Clock) =>
        new UserService(users, hasher, clock),
      inject: [USER_REPOSITORY, PASSWORD_HASHER, CLOCK],
    },
    {
      provide: MaterialService,
      useFactory: (
        materials: MaterialRepository,
        storage: FileStorage,
        clock: Clock,
        config: ModelConfig,
      ) => new MaterialService(materials, storage, clock, config),
      inject: [MATERIAL_REPOSITORY, FILE_STORAGE, CLOCK, MODEL_CONFIG],
    },
  ],
  exports: [AuthService, UserService, MaterialService],
})
export class ModelModule {}
