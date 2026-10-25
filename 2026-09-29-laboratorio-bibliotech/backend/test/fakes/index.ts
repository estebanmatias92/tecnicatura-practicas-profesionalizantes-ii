import { randomUUID } from 'crypto';
import { FileBlob, type FileBlobProps } from '../../src/model/entities/file-blob.entity';
import { Material, type MaterialProps } from '../../src/model/entities/material.entity';
import { Role, Visibility } from '../../src/model/entities/enums';
import { User, type UserProps } from '../../src/model/entities/user.entity';
import { UnauthorizedError } from '../../src/model/errors';
import type { Clock } from '../../src/model/repositories/clock';
import type { FileStorage, StoredFile } from '../../src/model/repositories/file-storage';
import type {
  MaterialFilter,
  MaterialPage,
  MaterialRepository,
} from '../../src/model/repositories/material.repository';
import type { PasswordHasher } from '../../src/model/repositories/password-hasher';
import type { TokenPayload, TokenService } from '../../src/model/repositories/token-service';
import type { UserRepository } from '../../src/model/repositories/user.repository';

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    return [...this.users.values()].find((user) => user.email === normalized) ?? null;
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async list(): Promise<User[]> {
    return [...this.users.values()];
  }
}

export class InMemoryMaterialRepository implements MaterialRepository {
  private readonly materials = new Map<string, Material>();
  readonly deletedBlobs: string[] = [];
  failNextSave = false;

  seed(material: Material): void {
    this.materials.set(material.id, material);
  }

  async findById(id: string, options?: { withDeleted?: boolean }): Promise<Material | null> {
    const material = this.materials.get(id) ?? null;
    if (!material) return null;
    if (material.deletedAt && !options?.withDeleted) return null;
    return material;
  }

  async save(material: Material): Promise<Material> {
    if (this.failNextSave) {
      this.failNextSave = false;
      throw new Error('fallo de persistencia');
    }
    this.materials.set(material.id, material);
    return material;
  }

  async deleteFileBlob(id: string): Promise<void> {
    this.deletedBlobs.push(id);
  }

  async listCatalog(filter: MaterialFilter): Promise<MaterialPage> {
    let items = [...this.materials.values()].filter((material) => material.isPublic());
    if (filter.q?.trim()) {
      const query = filter.q.trim().toLowerCase();
      items = items.filter(
        (material) =>
          material.title?.toLowerCase().includes(query) ||
          material.author?.toLowerCase().includes(query),
      );
    }
    if (filter.subject?.trim()) {
      const subject = filter.subject.trim().toLowerCase();
      items = items.filter((material) => material.subject?.toLowerCase().includes(subject));
    }
    if (filter.year) {
      items = items.filter((material) => material.year === filter.year);
    }
    const total = items.length;
    const start = (filter.page - 1) * filter.limit;
    return {
      items: items.slice(start, start + filter.limit),
      total,
      page: filter.page,
      limit: filter.limit,
    };
  }

  async listByOwner(ownerId: string): Promise<Material[]> {
    return [...this.materials.values()].filter(
      (material) => material.ownerId === ownerId && !material.deletedAt,
    );
  }

  async listAll(options: {
    includeDeleted: boolean;
    page: number;
    limit: number;
  }): Promise<MaterialPage> {
    const all = [...this.materials.values()].filter(
      (material) => options.includeDeleted || !material.deletedAt,
    );
    const start = (options.page - 1) * options.limit;
    return {
      items: all.slice(start, start + options.limit),
      total: all.length,
      page: options.page,
      limit: options.limit,
    };
  }
}

export class FakeFileStorage implements FileStorage {
  private readonly files = new Map<string, Buffer>();
  private counter = 0;
  readonly deleted: string[] = [];

  async save(buffer: Buffer, originalName: string, _mimeType: string): Promise<StoredFile> {
    this.counter += 1;
    const storageKey = `key-${this.counter}-${originalName}`;
    this.files.set(storageKey, buffer);
    return { storageKey, sizeBytes: buffer.length };
  }

  async read(storageKey: string): Promise<Buffer> {
    const buffer = this.files.get(storageKey);
    if (!buffer) throw new Error('archivo no encontrado');
    return buffer;
  }

  async delete(storageKey: string): Promise<void> {
    this.deleted.push(storageKey);
    this.files.delete(storageKey);
  }
}

export class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hash:${plain}`;
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hash:${plain}`;
  }
}

export class FakeTokenService implements TokenService {
  private readonly payloads = new Map<string, TokenPayload>();
  private counter = 0;

  sign(payload: TokenPayload): string {
    this.counter += 1;
    const token = `token-${this.counter}`;
    this.payloads.set(token, payload);
    return token;
  }

  verify(token: string): TokenPayload {
    const payload = this.payloads.get(token);
    if (!payload) throw new UnauthorizedError('Token inválido o expirado');
    return payload;
  }
}

export class FixedClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return this.current;
  }

  set(date: Date): void {
    this.current = date;
  }
}

export function makeUser(role: Role = Role.PROFESSOR, overrides: Partial<UserProps> = {}): User {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return User.rehydrate({
    id: 'u1',
    email: 'professor@bibliotech.local',
    passwordHash: 'hash:Secret1234!',
    role,
    tokenVersion: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

export function makeFile(overrides: Partial<FileBlobProps> = {}): FileBlob {
  return FileBlob.rehydrate({
    id: 'f1',
    storageKey: 'key-1-apunte.pdf',
    originalName: 'apunte.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

export function makeMaterial(overrides: Partial<MaterialProps> = {}): Material {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return Material.rehydrate({
    id: randomUUID(),
    title: 'Introducción a los sistemas',
    author: 'Ana Gómez',
    description: null,
    subject: null,
    year: null,
    ownerId: 'u1',
    file: null,
    visibility: Visibility.OCULTO,
    publishedAt: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}
