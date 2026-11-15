import { randomUUID } from 'crypto';
import { ValidationError } from '../errors';
import { FileBlob } from './file-blob.entity';
import { Visibility } from './enums';
import type { User } from './user.entity';

export interface MaterialProps {
  id: string;
  title: string | null;
  author: string | null;
  description: string | null;
  subject: string | null;
  year: number | null;
  ownerId: string;
  file: FileBlob | null;
  visibility: Visibility;
  publishedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  ownerEmail?: string;
}

export interface MaterialMetadataInput {
  title?: string | null;
  author?: string | null;
  description?: string | null;
  subject?: string | null;
  year?: number | null;
}

function normalizeText(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class Material {
  private constructor(private readonly props: MaterialProps) {}

  static createDraft(input: {
    ownerId: string;
    title?: string | null;
    author?: string | null;
    description?: string | null;
    subject?: string | null;
    year?: number | null;
    now?: Date;
  }): Material {
    const now = input.now ?? new Date();
    return new Material({
      id: randomUUID(),
      title: normalizeText(input.title) ?? null,
      author: normalizeText(input.author) ?? null,
      description: normalizeText(input.description) ?? null,
      subject: normalizeText(input.subject) ?? null,
      year: input.year ?? null,
      ownerId: input.ownerId,
      file: null,
      visibility: Visibility.OCULTO,
      publishedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: MaterialProps): Material {
    return new Material({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get title(): string | null {
    return this.props.title;
  }

  get author(): string | null {
    return this.props.author;
  }

  get description(): string | null {
    return this.props.description;
  }

  get subject(): string | null {
    return this.props.subject;
  }

  get year(): number | null {
    return this.props.year;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get ownerEmail(): string | undefined {
    return this.props.ownerEmail;
  }

  get file(): FileBlob | null {
    return this.props.file;
  }

  get visibility(): Visibility {
    return this.props.visibility;
  }

  get publishedAt(): Date | null {
    return this.props.publishedAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isDraft(): boolean {
    return this.props.publishedAt === null;
  }

  isPublic(): boolean {
    return this.props.visibility === Visibility.PUBLICO && this.props.deletedAt === null;
  }

  hasMetadata(): boolean {
    return (
      this.props.title !== null ||
      this.props.author !== null ||
      this.props.description !== null ||
      this.props.subject !== null ||
      this.props.year !== null
    );
  }

  canBePublished(): boolean {
    return (
      this.props.deletedAt === null &&
      this.props.title !== null &&
      this.props.author !== null &&
      this.props.file !== null
    );
  }

  publish(now = new Date()): void {
    if (this.props.deletedAt !== null) {
      throw new ValidationError('Un material eliminado no puede publicarse');
    }
    if (!this.canBePublished()) {
      throw new ValidationError('Para publicar se requieren título, autor y archivo');
    }
    this.props.visibility = Visibility.PUBLICO;
    this.props.publishedAt = this.props.publishedAt ?? now;
    this.props.updatedAt = now;
  }

  hide(now = new Date()): void {
    if (this.props.deletedAt !== null) {
      throw new ValidationError('Un material eliminado no puede ocultarse');
    }
    this.props.visibility = Visibility.OCULTO;
    this.props.updatedAt = now;
  }

  softDelete(now = new Date()): void {
    if (this.props.deletedAt !== null) return;
    this.props.deletedAt = now;
    this.props.updatedAt = now;
  }

  restore(now = new Date()): void {
    this.props.deletedAt = null;
    this.props.updatedAt = now;
  }

  attachFile(file: FileBlob, now = new Date()): FileBlob | null {
    if (this.props.deletedAt !== null) {
      throw new ValidationError('Un material eliminado no puede recibir archivos');
    }
    const previous = this.props.file;
    this.props.file = file;
    this.props.updatedAt = now;
    return previous;
  }

  updateMetadata(input: MaterialMetadataInput, now = new Date()): void {
    const next = {
      title: normalizeText(input.title),
      author: normalizeText(input.author),
      description: normalizeText(input.description),
      subject: normalizeText(input.subject),
      year: input.year === undefined ? undefined : input.year,
    };

    const published = this.props.publishedAt !== null;
    if (published && ((next.title !== undefined && next.title === null) || (next.author !== undefined && next.author === null))) {
      throw new ValidationError('Un material publicado no puede quedarse sin título ni autor');
    }

    if (next.title !== undefined) this.props.title = next.title;
    if (next.author !== undefined) this.props.author = next.author;
    if (next.description !== undefined) this.props.description = next.description;
    if (next.subject !== undefined) this.props.subject = next.subject;
    if (next.year !== undefined) this.props.year = next.year;

    if (!this.hasMetadata() && this.props.file === null) {
      throw new ValidationError('El material debe tener al menos un dato o un archivo');
    }

    this.props.updatedAt = now;
  }

  isVisibleTo(user: User): boolean {
    if (this.props.deletedAt !== null) return false;
    if (this.props.visibility === Visibility.PUBLICO) return true;
    return this.props.ownerId === user.id || user.isAdmin();
  }

  toProps(): MaterialProps {
    return { ...this.props };
  }
}
