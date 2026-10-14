// BR-003 + NFR-005 / UC-001/UC-002 [Pure Fabrication + Protected Variations -> Strategy]
// Validator central (class-validator). Cada regla es una Strategy: regla nueva
// = clase nueva, sin tocar callers (OCP, ADR-0002). TDD Slice 1 (RED).
import { BiblioValidator } from './bibliotech-validator';
import { DomainError } from '../../usecases/errors';

describe('BiblioValidator (BR-003 / UC-001)', () => {
  const v = new BiblioValidator();

  it('acepta email valido y password >= 8', () => {
    expect(() => v.validateEmail('alu@biblio.tech')).not.toThrow();
    expect(() => v.validatePassword('secreta99')).not.toThrow();
  });

  it.each(['mal', 'sin-arroba.com', '@sin-local.com', 'a@b'])('rechaza email %p con BAD_REQUEST', (email) => {
    expect(() => v.validateEmail(email)).toThrow(DomainError);
    try {
      v.validateEmail(email);
    } catch (e) {
      expect((e as DomainError).code).toBe('BAD_REQUEST');
    }
  });

  it.each(['corta', '1234567', ''])('rechaza password %p (< 8) con BAD_REQUEST', (pw) => {
    try {
      v.validatePassword(pw);
      throw new Error('no lanzo');
    } catch (e) {
      expect((e as DomainError).code).toBe('BAD_REQUEST');
    }
  });

  it('rechaza MIME fuera de PDF/EPUB y binario > 50MB (NFR-005, antes de persistir)', () => {
    expect(() => v.validateFile('application/pdf', 1024)).not.toThrow();
    expect(() => v.validateFile('application/epub+zip', 50 * 1024 * 1024)).not.toThrow();
    expect(() => v.validateFile('image/png', 100)).toThrow(expect.objectContaining({ code: 'UNSUPPORTED_MEDIA' }));
    expect(() => v.validateFile('application/pdf', 50 * 1024 * 1024 + 1)).toThrow(
      expect.objectContaining({ code: 'PAYLOAD_TOO_LARGE' }),
    );
  });
});
