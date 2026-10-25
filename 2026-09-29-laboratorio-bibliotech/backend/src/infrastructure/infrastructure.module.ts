import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CLOCK } from '../model/repositories/clock';
import { FILE_STORAGE } from '../model/repositories/file-storage';
import { MATERIAL_REPOSITORY } from '../model/repositories/material.repository';
import { PASSWORD_HASHER } from '../model/repositories/password-hasher';
import { TOKEN_SERVICE } from '../model/repositories/token-service';
import { USER_REPOSITORY } from '../model/repositories/user.repository';
import { HealthCheckService } from './persistence/health-check.service';
import { FileBlobOrm, MaterialOrm, UserOrm } from './persistence/typeorm/orm-entities';
import { TypeOrmMaterialRepository } from './persistence/typeorm/typeorm-material.repository';
import { TypeOrmUserRepository } from './persistence/typeorm/typeorm-user.repository';
import { BcryptPasswordHasher } from './security/bcrypt-password-hasher';
import { JwtTokenService } from './security/jwt-token.service';
import { SystemClock } from './security/system-clock';
import { DiskFileStorage } from './storage/disk-file-storage';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrm, MaterialOrm, FileBlobOrm]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ??
            '24h') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  providers: [
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: MATERIAL_REPOSITORY, useClass: TypeOrmMaterialRepository },
    { provide: FILE_STORAGE, useClass: DiskFileStorage },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: CLOCK, useClass: SystemClock },
    HealthCheckService,
  ],
  exports: [
    USER_REPOSITORY,
    MATERIAL_REPOSITORY,
    FILE_STORAGE,
    PASSWORD_HASHER,
    TOKEN_SERVICE,
    CLOCK,
    HealthCheckService,
  ],
})
export class InfrastructureModule {}
