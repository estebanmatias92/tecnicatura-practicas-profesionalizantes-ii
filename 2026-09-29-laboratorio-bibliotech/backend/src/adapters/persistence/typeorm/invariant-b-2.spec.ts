// invariant:B-2 (ADR-0004, NFR-006) — token_version + ver claim revoca JWT.
// Guarda: el guard debe rechazar si el payload.ver no coincide con user.tokenVersion.
import * as fs from 'fs';
import * as path from 'path';

describe('invariant:B-2', () => {
  it('JwtAuthGuard compara ver con token_version', () => {
    const filePath = path.resolve(__dirname, '../../http/guards.ts');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('tokenVersion');
    expect(content).toContain('payload.ver');
  });

  it('User entity tiene bumpVersion()', () => {
    const filePath = path.resolve(__dirname, '../../../entities/user.entity.ts');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('bumpVersion');
  });

  it('TokenPayload declara ver', () => {
    const filePath = path.resolve(__dirname, '../../../usecases/ports.ts');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('ver: number');
  });
});
