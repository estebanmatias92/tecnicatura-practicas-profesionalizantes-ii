// RST-004 [Indirection + Adapter GoF] — repositorios TypeORM tras los puertos.
// Mapean ORM <-> entidades de dominio (el dominio nunca ve decoradores).
// Cascadas en transaccion (C-1/C-2/C-3, E-001: la DB revierte; el FS lo limpia
// el usecase). Busqueda con QueryBuilder + indices (NFR-001 p95 <200ms).
import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserOrm, MaterialOrm, FileBlobOrm } from './orm-entities';
import { User } from '../../../entities/user.entity';
import { Material } from '../../../entities/material.entity';
import { FileBlob } from '../../../entities/file-blob.entity';
import { Role } from '../../../entities/role';
import { DomainError } from '../../../usecases/errors';
import type {
  UserRepository,
  MaterialRepository,
  FileBlobRepository,
  MaterialFilters,
  Page,
} from '../../../usecases/ports';

function toUser(row: UserOrm): User {
  const u = User.create({ email: row.email, passwordHash: row.passwordHash, role: row.role as Role });
  u.id = row.id;
  return u;
}

function toMaterial(row: MaterialOrm): Material {
  const m = Material.create({
    title: row.title,
    author: row.author,
    ownerId: row.ownerId,
    blobId: row.blobId,
    subject: row.subject ?? undefined,
    year: row.year ?? undefined,
    edition: row.edition ?? undefined,
    tags: row.tags ?? undefined,
  });
  m.id = row.id;
  m.createdAt = row.createdAt;
  return m;
}

function toBlob(row: FileBlobOrm): FileBlob {
  const b = FileBlob.create({
    storageKey: row.storageKey,
    fileName: row.fileName,
    mime: row.mime,
    sizeBytes: row.sizeBytes,
    contentHash: row.contentHash ?? undefined,
  });
  b.id = row.id;
  b.createdAt = row.createdAt;
  return b;
}

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrm) private readonly repo: Repository<UserOrm>,
    @InjectDataSource() private readonly db: DataSource,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.repo.findOneBy({ email });
    return row ? toUser(row) : null;
  }

  async findById(id: number): Promise<User | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? toUser(row) : null;
  }

  async findAll(): Promise<User[]> {
    return (await this.repo.find({ order: { id: 'ASC' } })).map(toUser);
  }

  async save(user: User): Promise<User> {
    const row = await this.repo.save({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
    });
    return toUser(row);
  }

  async deleteCascade(userId: number): Promise<string[]> {
    return this.db.transaction(async (tx) => {
      const mats = await tx.find(MaterialOrm, { where: { ownerId: userId }, relations: { blob: true } });
      const keys = mats.map((m) => m.blob.storageKey);
      const ids = mats.map((m) => m.id);
      if (ids.length > 0) {
        await tx.delete(MaterialOrm, ids);
        await tx.delete(FileBlobOrm, mats.map((m) => m.blobId));
      }
      await tx.delete(UserOrm, userId);
      return keys;
    });
  }
}

@Injectable()
export class TypeOrmMaterialRepository implements MaterialRepository {
  constructor(
    @InjectRepository(MaterialOrm) private readonly repo: Repository<MaterialOrm>,
    @InjectDataSource() private readonly db: DataSource,
  ) {}

  async save(material: Material): Promise<Material> {
    const row = await this.repo.save({
      id: material.id,
      title: material.title,
      author: material.author,
      subject: material.subject ?? null,
      year: material.year ?? null,
      edition: material.edition ?? null,
      tags: material.tags ?? null,
      ownerId: material.ownerId,
      blobId: material.blobId,
    });
    const full = await this.repo.findOneBy({ id: row.id });
    return toMaterial(full ?? row);
  }

  async findById(id: number): Promise<Material | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? toMaterial(row) : null;
  }

  async search(filters: MaterialFilters, page: number, limit: number): Promise<Page<Material>> {
    const qb = this.repo.createQueryBuilder('m').orderBy('m.createdAt', 'DESC');
    if (filters.q) {
      qb.andWhere('(m.title LIKE :q OR m.author LIKE :q OR m.subject LIKE :q)', { q: `%${filters.q}%` });
    }
    if (filters.title) qb.andWhere('m.title LIKE :title', { title: `%${filters.title}%` });
    if (filters.author) qb.andWhere('m.author LIKE :author', { author: `%${filters.author}%` });
    if (filters.subject) qb.andWhere('m.subject LIKE :subject', { subject: `%${filters.subject}%` });
    if (filters.year !== undefined) qb.andWhere('m.year = :year', { year: filters.year });
    if (filters.yearFrom !== undefined) qb.andWhere('m.year >= :from', { from: filters.yearFrom });
    if (filters.yearTo !== undefined) qb.andWhere('m.year <= :to', { to: filters.yearTo });
    if (filters.edition) qb.andWhere('LOWER(m.edition) = LOWER(:edition)', { edition: filters.edition });
    for (const tag of filters.tags ?? []) {
      qb.andWhere('JSON_CONTAINS(m.tags, :tag)', { tag: JSON.stringify(tag) });
    }
    const total = await qb.getCount();
    const rows = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { items: rows.map(toMaterial), total, page, limit };
  }

  async deleteWithBlob(id: number): Promise<{ storageKey: string }> {
    return this.db.transaction(async (tx) => {
      const mat = await tx.findOne(MaterialOrm, { where: { id }, relations: { blob: true } });
      if (!mat) throw new DomainError('NOT_FOUND', 'material inexistente');
      const key = mat.blob.storageKey;
      await tx.delete(MaterialOrm, id);
      await tx.delete(FileBlobOrm, mat.blobId);
      return { storageKey: key };
    });
  }
}

@Injectable()
export class TypeOrmFileBlobRepository implements FileBlobRepository {
  constructor(@InjectRepository(FileBlobOrm) private readonly repo: Repository<FileBlobOrm>) {}

  async save(blob: FileBlob): Promise<FileBlob> {
    const row = await this.repo.save({
      id: blob.id,
      storageKey: blob.storageKey,
      fileName: blob.fileName,
      mime: blob.mime,
      sizeBytes: blob.sizeBytes,
      contentHash: blob.contentHash ?? null,
    });
    return toBlob(row);
  }

  async findById(id: number): Promise<FileBlob | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? toBlob(row) : null;
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
