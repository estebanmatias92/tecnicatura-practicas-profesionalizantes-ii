import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compareSync, hashSync } from 'bcryptjs';
import type { PasswordHasher } from '../../model/repositories/password-hasher';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly cost: number;

  constructor(config: ConfigService) {
    this.cost = Number(config.get<string>('BCRYPT_COST') ?? 10);
  }

  hash(plain: string): Promise<string> {
    return Promise.resolve(hashSync(plain, this.cost));
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return Promise.resolve(compareSync(plain, hash));
  }
}
