// FR-004/FR-013 / UC-002/UC-004 [Creator] — el agregado se crea entero via
// create(); [Information Expert] isOwnedBy decide ownership local (C-1 -> 403).
// Reglas finas de formato en Validator; aqui invariantes no negociables.
export interface NewMaterial {
  title: string;
  author: string;
  ownerId: number;
  blobId: number;
  subject?: string;
  year?: number;
  edition?: string;
  tags?: string[];
}

export interface MaterialPatch {
  title?: string;
  author?: string;
  subject?: string;
  year?: number;
  edition?: string;
  tags?: string[];
}

export class Material {
  id?: number;
  title: string;
  author: string;
  subject?: string;
  year?: number;
  edition?: string;
  tags?: string[];
  ownerId: number;
  blobId: number;
  createdAt?: Date;

  private constructor(data: NewMaterial) {
    this.title = data.title.trim();
    this.author = data.author.trim();
    this.subject = data.subject;
    this.year = data.year;
    this.edition = data.edition;
    this.tags = data.tags;
    this.ownerId = data.ownerId;
    this.blobId = data.blobId;
  }

  static create(data: NewMaterial): Material {
    if (!data.title || data.title.trim().length === 0) throw new Error('Material.create: title requerido');
    if (!data.author || data.author.trim().length === 0) throw new Error('Material.create: author requerido');
    return new Material(data);
  }

  isOwnedBy(userId: number): boolean {
    return this.ownerId === userId;
  }

  applyPatch(patch: MaterialPatch): void {
    if (patch.title !== undefined) this.title = patch.title.trim();
    if (patch.author !== undefined) this.author = patch.author.trim();
    if (patch.subject !== undefined) this.subject = patch.subject;
    if (patch.year !== undefined) this.year = patch.year;
    if (patch.edition !== undefined) this.edition = patch.edition;
    if (patch.tags !== undefined) this.tags = patch.tags;
  }

  toPublic(): Record<string, unknown> {
    return {
      id: this.id,
      title: this.title,
      author: this.author,
      subject: this.subject,
      year: this.year,
      edition: this.edition,
      tags: this.tags,
      ownerId: this.ownerId,
      blobId: this.blobId,
      createdAt: this.createdAt,
    };
  }
}
