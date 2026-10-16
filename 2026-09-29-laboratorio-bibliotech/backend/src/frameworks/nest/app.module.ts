// Frameworks — AppModule: cableado DI (Factory, ADR-0001). Puertos de
// usecases -> implementaciones (TypeORM, Jwt, Bcrypt, Disk, Validator).
// Guards globales: JWT primero (401), rol despues (403) — BR-002/NFR-006.
// Solo /auth/* es @Public(); todo lo demas exige Bearer.
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { UserOrm, MaterialOrm, FileBlobOrm } from '../../adapters/persistence/typeorm/orm-entities';
import {
  TypeOrmUserRepository,
  TypeOrmMaterialRepository,
  TypeOrmFileBlobRepository,
} from '../../adapters/persistence/typeorm/typeorm-repositories';
import { DiskFileStorage } from '../../adapters/storage/disk-file-storage';
import { BiblioValidator } from '../../adapters/validators/bibliotech-validator';
import { BcryptHasher } from '../security/bcrypt-hasher';
import { JwtTokenSigner } from '../security/jwt-signer';
import { RegisterUserUseCase } from '../../usecases/register-user.usecase';
import { LoginUseCase } from '../../usecases/login.usecase';
import { UploadMaterialUseCase } from '../../usecases/upload-material.usecase';
import { SearchCatalogUseCase } from '../../usecases/search-catalog.usecase';
import { ManageMaterialUseCase } from '../../usecases/manage-material.usecase';
import { DownloadFileUseCase } from '../../usecases/download-file.usecase';
import { AuthController } from '../../adapters/http/auth.controller';
import { MaterialsController } from '../../adapters/http/materials.controller';
import { UsersController } from '../../adapters/http/users.controller';
import { JwtAuthGuard, RolesGuard } from '../../adapters/http/guards';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'mariadb',
        host: cfg.get('DB_HOST', 'localhost'),
        port: Number(cfg.get('DB_PORT', '3306')),
        username: cfg.get('DB_USER', 'bibliotech'),
        password: cfg.get('DB_PASSWORD', 'bibliotech'),
        database: cfg.get('DB_NAME', 'bibliotech'),
        entities: [UserOrm, MaterialOrm, FileBlobOrm],
        synchronize: cfg.get('DB_SYNCHRONIZE', 'true') === 'true',
      }),
    }),
    TypeOrmModule.forFeature([UserOrm, MaterialOrm, FileBlobOrm]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const secret = cfg.get('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET requerido (NFR-004: sin default inseguro)');
        return { secret, signOptions: { expiresIn: `${cfg.get('JWT_EXPIRES_H', '24')}h` } };
      },
    }),
  ],
  controllers: [AuthController, MaterialsController, UsersController],
  providers: [
    TypeOrmUserRepository,
    TypeOrmMaterialRepository,
    TypeOrmFileBlobRepository,
    {
      provide: 'PasswordHasherPort',
      useFactory: () => new BcryptHasher(10),
    },
    {
      provide: 'TokenSignerPort',
      useFactory: (jwt: JwtService) => new JwtTokenSigner(jwt),
      inject: [JwtService],
    },
    {
      provide: 'ValidatorPort',
      useFactory: () => new BiblioValidator(),
    },
    {
      provide: 'FileStoragePort',
      useFactory: (cfg: ConfigService) => new DiskFileStorage(cfg.get('UPLOAD_DIR', './uploads')),
      inject: [ConfigService],
    },
    {
      provide: RegisterUserUseCase,
      useFactory: (u: TypeOrmUserRepository, h: BcryptHasher, s: JwtTokenSigner, v: BiblioValidator) =>
        new RegisterUserUseCase(u, h, s, v),
      inject: [TypeOrmUserRepository, 'PasswordHasherPort', 'TokenSignerPort', 'ValidatorPort'],
    },
    {
      provide: LoginUseCase,
      useFactory: (u: TypeOrmUserRepository, h: BcryptHasher, s: JwtTokenSigner, v: BiblioValidator) =>
        new LoginUseCase(u, h, s, v),
      inject: [TypeOrmUserRepository, 'PasswordHasherPort', 'TokenSignerPort', 'ValidatorPort'],
    },
    {
      provide: UploadMaterialUseCase,
      useFactory: (v: BiblioValidator, s: DiskFileStorage, m: TypeOrmMaterialRepository, b: TypeOrmFileBlobRepository) =>
        new UploadMaterialUseCase(v, s, m, b),
      inject: ['ValidatorPort', 'FileStoragePort', TypeOrmMaterialRepository, TypeOrmFileBlobRepository],
    },
    {
      provide: SearchCatalogUseCase,
      useFactory: (m: TypeOrmMaterialRepository) => new SearchCatalogUseCase(m),
      inject: [TypeOrmMaterialRepository],
    },
    {
      provide: ManageMaterialUseCase,
      useFactory: (u: TypeOrmUserRepository, m: TypeOrmMaterialRepository, s: DiskFileStorage, v: BiblioValidator) =>
        new ManageMaterialUseCase(u, m, s, v),
      inject: [TypeOrmUserRepository, TypeOrmMaterialRepository, 'FileStoragePort', 'ValidatorPort'],
    },
    {
      provide: DownloadFileUseCase,
      useFactory: (m: TypeOrmMaterialRepository, b: TypeOrmFileBlobRepository, s: DiskFileStorage) =>
        new DownloadFileUseCase(m, b, s),
      inject: [TypeOrmMaterialRepository, TypeOrmFileBlobRepository, 'FileStoragePort'],
    },
    {
      provide: APP_GUARD,
      useFactory: (s: JwtTokenSigner, r: Reflector, u: TypeOrmUserRepository) => new JwtAuthGuard(s, r, u),
      inject: ['TokenSignerPort', Reflector, TypeOrmUserRepository],
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
