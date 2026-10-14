// Puertos + errores de la capa UseCases (Application Rules).
// Los adapters implementan estos puertos (Indirection: ambos lados dependen
// de algo estable, ADR-0001). Ningun import de frameworks aqui.
import type { User } from '../entities/user.entity';
import type { Material } from '../entities/material.entity';
import type { MaterialPatch as Patch } from '../entities/material.entity';
export type { MaterialPatch } from '../entities/material.entity';
import type { FileBlob } from '../entities/file-blob.entity';
import type { Role } from '../entities/role';
import { DomainError } from './errors';

export { DomainError };
export type { DomainErrorCode } from './errors';

export interface MaterialMeta {
  title: string;
  author: string;
  subject?: string;
  year?: number;
  edition?: string;
  tags?: string[];
}

export interface MaterialFilters {
  q?: string;
  title?: string;
  author?: string;
  subject?: string;
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  edition?: string;
  tags?: string[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface UploadedFile {
  buffer: Buffer;
  mime: string;
  size: number;
  originalName: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<User>;
  /** Borra cuenta + materials + blobs; retorna storageKeys a limpiar en FS (C-2). */
  deleteCascade(userId: number): Promise<string[]>;
}

export interface MaterialRepository {
  save(material: Material): Promise<Material>;
  findById(id: number): Promise<Material | null>;
  search(filters: MaterialFilters, page: number, limit: number): Promise<Page<Material>>;
  /** Borra material + blob; retorna storageKey a limpiar en FS (C-1/C-3). */
  deleteWithBlob(id: number): Promise<{ storageKey: string }>;
}

export interface FileBlobRepository {
  save(blob: FileBlob): Promise<FileBlob>;
  findById(id: number): Promise<FileBlob | null>;
  delete(id: number): Promise<void>;
}

export interface FileStorage {
  store(buffer: Buffer, originalName: string): Promise<string>;
  stream(storageKey: string): unknown;
  remove(storageKey: string): Promise<void>;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

export interface TokenPayload {
  userId: number;
  role: Role;
}

export interface TokenSigner {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}

/** Pure Fabrication (ADR-0002): reglas fuera del dominio; cada regla es una
 *  Strategy tras esta interfaz (Protected Variations). */
export interface ValidatorPort {
  validateEmail(email: string): void;
  validatePassword(password: string): void;
  validateMetadata(meta: MaterialMeta | Patch): void;
  validateFile(mime: string, sizeBytes: number): void;
}
