// NFR-003/NFR-004 auditoria de seguridad [integration frameworks].
// Mapea a backend/tests/cases/NFR-003-004-006.feature (escenarios de config).
// Sin Nest TestModule: drivers reales (BcryptHasher, JwtService) + escaneo
// estatico de src (sin secretos en logs/respuestas). Rapido y sin DB.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { JwtService } from '@nestjs/jwt';
import { BcryptHasher } from '../../src/frameworks/security/bcrypt-hasher';
import { JwtTokenSigner } from '../../src/frameworks/security/jwt-signer';
import { RegisterUserUseCase } from '../../src/usecases/register-user.usecase';
import { LoginUseCase } from '../../src/usecases/login.usecase';
import { Role } from '../../src/entities/role';
import { User } from '../../src/entities/user.entity';
import { createWorld } from '../helpers/fakes';

const SRC = join(__dirname, '..', '..', 'src');

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tsFiles(full));
    else if (full.endsWith('.ts')) out.push(full);
  }
  return out;
}

describe('NFR-003 hash + expiracion de sesion', () => {
  it('BCrypt con cost menor a 10 es rechazado en el constructor', () => {
    expect(() => new BcryptHasher(9)).toThrow(/cost >= 10/);
  });

  it('BCrypt cost por defecto 10: roundtrip hash/compare sin comparar en claro', async () => {
    const hasher = new BcryptHasher();
    const hash = await hasher.hash('Segura123');
    expect(hash).not.toContain('Segura123');
    expect(await hasher.compare('Segura123', hash)).toBe(true);
    expect(await hasher.compare('Otra9999', hash)).toBe(false);
  });

  it('JWT emitido con la config de fabrica (24h) expira en <=24h', () => {
    // Misma expresion que AppModule: `${JWT_EXPIRES_H ?? 24}h` (docker-compose fija 24).
    const hours = Number(process.env['JWT_EXPIRES_H'] ?? '24');
    expect(hours).toBeLessThanOrEqual(24);
    const jwt = new JwtService({ secret: 'test-only', signOptions: { expiresIn: `${hours}h` } });
    const signer = new JwtTokenSigner(jwt);
    const token = signer.sign({ userId: 1, role: Role.Student, ver: 0 });
    const decoded = jwt.decode(token) as { exp: number; iat: number };
    expect(decoded.exp - decoded.iat).toBeLessThanOrEqual(24 * 3600);
    expect(signer.verify(token)).toEqual({ userId: 1, role: Role.Student, ver: 0 });
  });
});

describe('NFR-004 sin secretos en claro ni en logs', () => {
  it('toPublic de User no expone password ni hash', () => {
    const pub = User.create({ email: 'a@b.c', passwordHash: 'hash-opaco', role: Role.Student }).toPublic();
    expect(Object.keys(pub).sort()).toEqual(['email', 'id', 'role']);
    expect(JSON.stringify(pub)).not.toContain('hash-opaco');
  });

  it('register/login nunca devuelven password en la respuesta', async () => {
    const w = createWorld();
    const register = new RegisterUserUseCase(w.users, w.hasher, w.signer, w.validator);
    const login = new LoginUseCase(w.users, w.hasher, w.signer, w.validator);
    const reg = await register.execute({ email: 'audit@biblio.tech', password: 'Segura123' });
    const log = await login.execute({ email: 'audit@biblio.tech', password: 'Segura123' });
    for (const out of [reg, log]) {
      expect(Object.keys(out).sort()).toEqual(['role', 'token', 'userId']);
    }
  });

  it('0 console.log/debug/info en src (solo banner de bootstrap en main.ts)', () => {
    const offenders: string[] = [];
    for (const f of tsFiles(SRC)) {
      if (f.endsWith('.spec.ts')) continue;
      const src = readFileSync(f, 'utf8');
      const hit = /console\.(log|debug|info|warn|error)/.test(src);
      if (hit && !f.endsWith('frameworks/main.ts')) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });
});
