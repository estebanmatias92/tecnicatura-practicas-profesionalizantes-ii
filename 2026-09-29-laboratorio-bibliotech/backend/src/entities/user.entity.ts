// FR-001 / UC-001 [Creator] — User.create() unico dueno del ciclo de vida.
// [Information Expert] normaliza lo que conoce (email trim+lowercase).
// Invariantes minimos aqui; reglas BR-003 (formato) en Validator (ADR-0002).
import { Role, isRole } from './role';

export interface NewUser {
  email: string;
  passwordHash: string;
  role: Role;
  tokenVersion?: number;
}

export class User {
  id?: number;
  email: string;
  passwordHash: string;
  role: Role;
  tokenVersion: number;

  private constructor(data: NewUser & { tokenVersion?: number }) {
    this.email = data.email.trim().toLowerCase();
    this.passwordHash = data.passwordHash;
    this.role = data.role;
    this.tokenVersion = data.tokenVersion ?? 0;
  }

  static create(data: NewUser): User {
    if (!data.email || data.email.trim().length === 0) throw new Error('User.create: email requerido');
    if (!data.passwordHash) throw new Error('User.create: passwordHash requerido (nunca en claro)');
    if (!isRole(data.role)) throw new Error(`User.create: rol invalido (${String(data.role)})`);
    return new User(data);
  }

  bumpVersion(): void {
    this.tokenVersion += 1;
  }

  toPublic(): { id?: number; email: string; role: Role } {
    return { id: this.id, email: this.email, role: this.role };
  }
}
