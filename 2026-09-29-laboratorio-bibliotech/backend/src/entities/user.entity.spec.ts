// FR-001 / UC-001 [Creator] — User.create() es el unico dueno del ciclo de vida;
// [Information Expert] User normaliza lo que conoce (email).
// TDD Slice 1 (RED): esta spec debe FALLAR hasta que exista user.entity.ts.
import { User } from './user.entity';
import { Role } from './role';

describe('User entity (FR-001 / UC-001)', () => {
  it('create asigna email normalizado (trim + lowercase), hash y rol', () => {
    const u = User.create({ email: '  Profe@Biblio.Tech ', passwordHash: 'hash-x', role: Role.Professor });
    expect(u.email).toBe('profe@biblio.tech');
    expect(u.passwordHash).toBe('hash-x');
    expect(u.role).toBe(Role.Professor);
  });

  it('create rechaza email vacio (invariante minima; reglas BR-003 viven en Validator)', () => {
    expect(() => User.create({ email: '   ', passwordHash: 'h', role: Role.Student })).toThrow();
  });

  it('create rechaza passwordHash vacio (nunca usuario sin secreto hasheado)', () => {
    expect(() => User.create({ email: 'a@b.c', passwordHash: '', role: Role.Student })).toThrow();
  });

  it('create rechaza rol fuera del enum Admin/Professor/Student', () => {
    expect(() => User.create({ email: 'a@b.c', passwordHash: 'h', role: 'Jefe' as Role })).toThrow();
  });
});
