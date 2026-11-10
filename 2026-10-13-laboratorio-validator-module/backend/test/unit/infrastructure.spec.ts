import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Role } from '../../src/model/entities/enums';
import { UnauthorizedError } from '../../src/model/errors';
import { BcryptPasswordHasher } from '../../src/infrastructure/security/bcrypt-password-hasher';
import { JwtTokenService } from '../../src/infrastructure/security/jwt-token.service';
import { SystemClock } from '../../src/infrastructure/security/system-clock';
import { DiskFileStorage } from '../../src/infrastructure/storage/disk-file-storage';

function config(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

describe('BcryptPasswordHasher', () => {
  it('hashes and compares passwords', async () => {
    const hasher = new BcryptPasswordHasher(config({ BCRYPT_COST: '4' }));
    const hash = await hasher.hash('Secret1234!');

    expect(hash).not.toBe('Secret1234!');
    await expect(hasher.compare('Secret1234!', hash)).resolves.toBe(true);
    await expect(hasher.compare('incorrecta', hash)).resolves.toBe(false);
  });
});

describe('JwtTokenService', () => {
  const secret = 'x'.repeat(40);
  const payload = {
    sub: 'u1',
    email: 'ana@bibliotech.local',
    role: Role.PROFESSOR,
    ver: 0,
  };

  it('signs and verifies payloads', () => {
    const service = new JwtTokenService(
      new JwtService({ secret, signOptions: { expiresIn: '1h' } }),
    );
    const token = service.sign(payload);
    expect(service.verify(token)).toMatchObject(payload);
  });

  it('rejects invalid, expired and incomplete tokens', () => {
    const service = new JwtTokenService(new JwtService({ secret }));
    expect(() => service.verify('invalid')).toThrow(UnauthorizedError);

    const expired = new JwtTokenService(
      new JwtService({ secret, signOptions: { expiresIn: '-1s' } }),
    ).sign(payload);
    expect(() => service.verify(expired)).toThrow(UnauthorizedError);

    const incomplete = new JwtService({ secret }).sign({ foo: 'bar' });
    expect(() => service.verify(incomplete)).toThrow(UnauthorizedError);
  });
});

describe('DiskFileStorage', () => {
  let directory: string;
  let storage: DiskFileStorage;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'bibliotech-storage-'));
    storage = new DiskFileStorage(config({ UPLOAD_DIR: directory }));
    await storage.onModuleInit();
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('saves, reads and deletes files', async () => {
    const buffer = Buffer.from('contenido');
    const stored = await storage.save(buffer, 'apunte.pdf', 'application/pdf');

    expect(stored.sizeBytes).toBe(buffer.length);
    await expect(storage.read(stored.storageKey)).resolves.toEqual(buffer);
    await storage.delete(stored.storageKey);
    await expect(storage.read(stored.storageKey)).rejects.toThrow();
  });

  it('rejects path traversal keys and ignores missing deletes', async () => {
    await expect(storage.read('../secreto')).rejects.toThrow('storageKey inválida');
    await expect(storage.delete('../secreto')).resolves.toBeUndefined();
    await expect(storage.delete('no-existe.pdf')).resolves.toBeUndefined();
  });
});

describe('SystemClock', () => {
  it('returns the current date', () => {
    const before = Date.now();
    const now = new SystemClock().now().getTime();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });
});
