// FR-001 / UC-001 [Creator] — User.create() unico dueno del ciclo de vida.
// [Information Expert] normaliza lo que conoce (email trim+lowercase).
// Invariantes minimos aqui; reglas BR-003 (formato) en Validator (ADR-0002).
import { Role, isRole } from './role';

export interface NewUser {
  email: string;
  passwordHash: string;
  role: Role;
}

export class User {
  id?: number;
  email: string;
  passwordHash: string;
  role: Role;

  private constructor(data: NewUser) {
    this.email = data.email.trim().toLowerCase();
    this.passwordHash = data.passwordHash;
    this.role = data.role;
  }

  static create(data: NewUser): User {
    if (!data.email || data.email.trim().length === 0) throw new Error('User.create: email requerido');
    if (!data.passwordHash) throw new Error('User.create: passwordHash requerido (nunca en claro)');
    if (!isRole(data.role)) throw new Error(`User.create: rol invalido (${String(data.role)})`);
    return new User(data);
  }

  toPublic(): { id?: number; email: string; role: Role } {
    return { id: this.id, email: this.email, role: this.role };
  }
}
