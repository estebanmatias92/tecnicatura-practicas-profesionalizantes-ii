// NFR-003 / UC-001 [Indirection] — BcryptHasher implementa PasswordHasher.
// Vive en frameworks (driver de crypto): cost >= 10 (NFR-003), nunca compara
// en claro. Inyectado por DI (Factory, ADR-0001).
import * as bcrypt from 'bcrypt';
import type { PasswordHasher } from '../../usecases/ports';

export class BcryptHasher implements PasswordHasher {
  constructor(private readonly cost: number = 10) {
    if (cost < 10) throw new Error('BcryptHasher: cost >= 10 (NFR-003)');
  }

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.cost);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
