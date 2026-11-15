import { randomUUID } from 'crypto';
import { Role } from './enums';
import type { Material } from './material.entity';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(input: {
    email: string;
    passwordHash: string;
    role: Role;
    now?: Date;
  }): User {
    const now = input.now ?? new Date();
    return new User({
      id: randomUUID(),
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role,
      tokenVersion: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: UserProps): User {
    return new User({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): Role {
    return this.props.role;
  }

  get tokenVersion(): number {
    return this.props.tokenVersion;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isAdmin(): boolean {
    return this.props.role === Role.ADMIN;
  }

  isProfessor(): boolean {
    return this.props.role === Role.PROFESSOR;
  }

  canManage(material: Material): boolean {
    return this.isAdmin() || material.ownerId === this.props.id;
  }

  withRole(role: Role, now = new Date()): User {
    return new User({ ...this.props, role, tokenVersion: this.props.tokenVersion + 1, updatedAt: now });
  }

  toProps(): UserProps {
    return { ...this.props };
  }
}
