// Verify helpers — mundo en memoria para e2e/integration sin DB.
// Fakes con estado (no mocks): encadenan upload -> read -> search -> delete
// con la misma semantica de filtros que exige UC-005 (q parcial
// case-insensitive, AND entre params, tags AND, rango inclusivo, orden
// mas-reciente-primero via id desc, defaults 1/10 max 50 en el usecase).
// La variante DB-backed (TypeOrm + MariaDB 11) vive en
// test/integration/cascade.spec.ts como pendiente (ver test-cases.md GAP-002).
import { User } from '../../src/entities/user.entity';
import { Material } from '../../src/entities/material.entity';
import { FileBlob } from '../../src/entities/file-blob.entity';
import { Role } from '../../src/entities/role';
import { BiblioValidator } from '../../src/adapters/validators/bibliotech-validator';
import type {
  UserRepository,
  MaterialRepository,
  FileBlobRepository,
  FileStorage,
  PasswordHasher,
  TokenSigner,
  TokenPayload,
  MaterialFilters,
  Page,
} from '../../src/usecases/ports';

export class FakeUsers implements UserRepository {
  private seq = 1;
  readonly rows = new Map<number, User>();
  materials?: FakeMaterials;
  blobs?: FakeBlobs;

  async findByEmail(email: string): Promise<User | null> {
    const norm = email.trim().toLowerCase();
    for (const u of this.rows.values()) if (u.email === norm) return u;
    return null;
  }
  async findById(id: number): Promise<User | null> {
    return this.rows.get(id) ?? null;
  }
  async findAll(): Promise<User[]> {
    return [...this.rows.values()];
  }
  async save(user: User): Promise<User> {
    if (user.id === undefined) user.id = this.seq++;
    this.rows.set(user.id, user);
    return user;
  }
  /** C-2: borra cuenta + sus materials + blobs; retorna storageKeys a limpiar. */
  async deleteCascade(userId: number): Promise<string[]> {
    const keys: string[] = [];
    if (this.materials && this.blobs) {
      for (const m of [...this.materials.rows.values()]) {
        if (m.ownerId === userId) {
          const b = m.blobId !== undefined ? await this.blobs.findById(m.blobId) : null;
          if (b) keys.push(b.storageKey);
          await this.materials.deleteWithBlob(m.id as number);
        }
      }
    }
    this.rows.delete(userId);
    return keys;
  }
}

export class FakeMaterials implements MaterialRepository {
  private seq = 1;
  readonly rows = new Map<number, Material>();
  constructor(private readonly blobs: FakeBlobs) {}

  async save(material: Material): Promise<Material> {
    if (material.id === undefined) material.id = this.seq++;
    if (material.createdAt === undefined) material.createdAt = new Date();
    this.rows.set(material.id, material);
    return material;
  }
  async findById(id: number): Promise<Material | null> {
    return this.rows.get(id) ?? null;
  }
  async search(filters: MaterialFilters, page: number, limit: number): Promise<Page<Material>> {
    const norm = (s: string): string => s.toLowerCase();
    let items = [...this.rows.values()].sort((a, b) => (b.id as number) - (a.id as number));
    const q = filters.q?.trim().toLowerCase();
    if (q) {
      items = items.filter((m) => norm(`${m.title} ${m.author} ${m.subject ?? ''}`).includes(q));
    }
    if (filters.author !== undefined) {
      items = items.filter((m) => norm(m.author).includes(norm(filters.author as string)));
    }
    if (filters.subject !== undefined) {
      items = items.filter((m) => norm(m.subject ?? '').includes(norm(filters.subject as string)));
    }
    if (filters.year !== undefined) items = items.filter((m) => m.year === filters.year);
    if (filters.yearFrom !== undefined) items = items.filter((m) => (m.year ?? -Infinity) >= (filters.yearFrom as number));
    if (filters.yearTo !== undefined) items = items.filter((m) => (m.year ?? Infinity) <= (filters.yearTo as number));
    if (filters.edition !== undefined) {
      items = items.filter((m) => norm(m.edition ?? '') === norm(filters.edition as string));
    }
    if (filters.tags !== undefined && filters.tags.length > 0) {
      const want = filters.tags.map(norm);
      items = items.filter((m) => {
        const have = new Set((m.tags ?? []).map(norm));
        return want.every((t) => have.has(t));
      });
    }
    const total = items.length;
    return { items: items.slice((page - 1) * limit, page * limit), total, page, limit };
  }
  /** C-1/C-3: borra material + su blob; retorna storageKey a limpiar en FS. */
  async deleteWithBlob(id: number): Promise<{ storageKey: string }> {
    const m = this.rows.get(id);
    if (!m) throw new Error(`FakeMaterials.deleteWithBlob: ${id} inexistente`);
    const blob = m.blobId !== undefined ? await this.blobs.findById(m.blobId) : null;
    if (m.blobId !== undefined) await this.blobs.delete(m.blobId);
    this.rows.delete(id);
    return { storageKey: blob?.storageKey ?? '' };
  }
}

export class FakeBlobs implements FileBlobRepository {
  private seq = 1;
  readonly rows = new Map<number, FileBlob>();
  async save(blob: FileBlob): Promise<FileBlob> {
    if (blob.id === undefined) blob.id = this.seq++;
    this.rows.set(blob.id, blob);
    return blob;
  }
  async findById(id: number): Promise<FileBlob | null> {
    return this.rows.get(id) ?? null;
  }
  async delete(id: number): Promise<void> {
    this.rows.delete(id);
  }
}

export class FakeStorage implements FileStorage {
  readonly files = new Map<string, Buffer>();
  failOnStore = false;
  failOnRemove = false;
  failOnStream = false;
  private seq = 1;

  async store(buffer: Buffer, originalName: string): Promise<string> {
    if (this.failOnStore) throw new Error('FakeStorage.store: disco lleno (E-001 simulado)');
    const key = `mem-${this.seq++}-${originalName}`;
    this.files.set(key, buffer);
    return key;
  }
  stream(storageKey: string): unknown {
    if (this.failOnStream) throw new Error('FakeStorage.stream: storage caido (E-001 simulado)');
    return this.files.get(storageKey);
  }
  async remove(storageKey: string): Promise<void> {
    if (this.failOnRemove) throw new Error('FakeStorage.remove: EIO al borrar (E-001 simulado)');
    this.files.delete(storageKey); // idempotente como DiskFileStorage (ignora ENOENT)
  }
}

export class FakeHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }
  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}

export class FakeSigner implements TokenSigner {
  sign(payload: TokenPayload): string {
    return `jwt.${payload.userId}.${payload.role}`;
  }
  verify(token: string): TokenPayload {
    const parts = token.split('.');
    const userId = Number(parts[1]);
    const role = parts[2] as Role;
    if (parts[0] !== 'jwt' || !Number.isInteger(userId) || (role !== Role.Admin && role !== Role.Professor && role !== Role.Student)) {
      throw new Error('FakeSigner.verify: token invalido o expirado');
    }
    return { userId, role };
  }
}

export interface World {
  users: FakeUsers;
  materials: FakeMaterials;
  blobs: FakeBlobs;
  storage: FakeStorage;
  hasher: FakeHasher;
  signer: FakeSigner;
  validator: BiblioValidator;
}

/** Mundo fresco por test: wirings users <-> materials <-> blobs para cascada C-2. */
export function createWorld(): World {
  const blobs = new FakeBlobs();
  const materials = new FakeMaterials(blobs);
  const users = new FakeUsers();
  users.materials = materials;
  users.blobs = blobs;
  return {
    users,
    materials,
    blobs,
    storage: new FakeStorage(),
    hasher: new FakeHasher(),
    signer: new FakeSigner(),
    validator: new BiblioValidator(),
  };
}

/** PDF minimo valido como bytes (el contenido no se parsea, solo se almacena). */
export function pdfBytes(n = 1024): Buffer {
  const head = Buffer.from('%PDF-1.4 fake\n');
  return Buffer.concat([head, Buffer.alloc(Math.max(0, n - head.length), 0x41)]);
}
