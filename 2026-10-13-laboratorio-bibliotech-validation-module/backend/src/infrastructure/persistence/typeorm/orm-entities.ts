import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { Role, Visibility } from '../../../model/entities/enums';

@Entity('users')
export class UserOrm {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 20 })
  role!: Role;

  @Column({ name: 'token_version', type: 'int', default: 0 })
  tokenVersion!: number;

  @Column({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}

@Entity('file_blobs')
export class FileBlobOrm {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'storage_key', type: 'varchar', length: 255, unique: true })
  storageKey!: string;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes!: number;

  @Column({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;
}

@Entity('materials')
@Index(['visibility', 'deletedAt'])
@Index(['ownerId'])
export class MaterialOrm {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  author!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  subject!: string | null;

  @Column({ name: 'publication_year', type: 'int', nullable: true })
  year!: number | null;

  @Column({ type: 'varchar', length: 20 })
  visibility!: Visibility;

  @Column({ name: 'published_at', type: 'datetime', precision: 6, nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'deleted_at', type: 'datetime', precision: 6, nullable: true })
  deletedAt!: Date | null;

  @Column({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;

  @Column({ name: 'owner_id', type: 'varchar', length: 36 })
  ownerId!: string;

  @Column({ name: 'file_blob_id', type: 'varchar', length: 36, nullable: true, unique: true })
  fileBlobId!: string | null;

  // Propiedades de proyección: se completan con leftJoinAndMapOne, no son columnas.
  owner?: UserOrm;
  file?: FileBlobOrm | null;
}
