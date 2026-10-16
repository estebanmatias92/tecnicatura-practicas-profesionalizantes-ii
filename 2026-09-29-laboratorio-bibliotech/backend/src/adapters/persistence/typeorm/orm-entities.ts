// RST-004 / todas UC [Indirection] — ORM entities TypeORM (MariaDB 11).
// El dominio (entities/) nunca importa esto; los repos adaptan ORM <-> dominio.
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('users')
export class UserOrm {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column({ type: 'enum', enum: ['Admin', 'Professor', 'Student'] })
  role!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('file_blobs')
export class FileBlobOrm {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'storage_key', unique: true, length: 255 })
  storageKey!: string;

  @Column({ name: 'file_name', length: 255 })
  fileName!: string;

  @Column({ length: 100 })
  mime!: string;

  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes!: number;

  @Column({ name: 'content_hash', type: 'char', length: 64, nullable: true })
  contentHash!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('materials')
export class MaterialOrm {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  title!: string;

  @Column({ length: 120 })
  author!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  subject!: string | null;

  @Column({ type: 'int', nullable: true })
  year!: number | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  edition!: string | null;

  @Column({ type: 'json', nullable: true })
  tags!: string[] | null;

  @Column({ name: 'owner_id' })
  ownerId!: number;

  @ManyToOne(() => UserOrm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: UserOrm;

  @Column({ name: 'blob_id', unique: true })
  blobId!: number;

  @ManyToOne(() => FileBlobOrm, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'blob_id' })
  blob!: FileBlobOrm;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
