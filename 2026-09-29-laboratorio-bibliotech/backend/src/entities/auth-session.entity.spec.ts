// FR-002 / UC-001 [Information Expert] — AuthSession conoce token/userId/exp
// y decide su propia expiracion. TDD Slice 1 (RED).
import { AuthSession } from './auth-session.entity';

describe('AuthSession entity (FR-002 / UC-001)', () => {
  it('isExpired es false antes del vencimiento', () => {
    const s = new AuthSession('tok', 7, 'Student', new Date(Date.now() + 60_000));
    expect(s.isExpired(new Date())).toBe(false);
  });

  it('isExpired es true despues del vencimiento (NFR-003: JWT <= 24h se verifica aqui)', () => {
    const s = new AuthSession('tok', 7, 'Student', new Date(Date.now() - 1_000));
    expect(s.isExpired(new Date())).toBe(true);
  });

  it('toPublic nunca expone secretos (NFR-004)', () => {
    const s = new AuthSession('tok', 7, 'Student', new Date(Date.now() + 60_000));
    expect(JSON.stringify(s.toPublic())).not.toContain('tok');
    expect(s.toPublic()).toEqual({ userId: 7, role: 'Student' });
  });
});
