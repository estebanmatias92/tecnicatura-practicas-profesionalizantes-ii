// FR-004/FR-008 / UC-002/UC-006 [Information Expert] — FileBlob conoce
// storageKey/mime/size. contentHash informativo: ninguna decision vive en el
// (BR-004 v0.4.0, sin dedup). Nace y muere con su Material (1:1, BR-004).
export interface NewFileBlob {
  storageKey: string;
  /** Nombre original del recurso para el usuario (UC-006 Content-Disposition).
   *  Decision stakeholder 2026-10-14: el filename es UX, nunca clave (BR-004). */
  fileName: string;
  mime: string;
  sizeBytes: number;
  contentHash?: string;
}

export class FileBlob {
  id?: number;
  storageKey: string;
  fileName: string;
  mime: string;
  sizeBytes: number;
  contentHash?: string;
  createdAt?: Date;

  private constructor(data: NewFileBlob) {
    this.storageKey = data.storageKey;
    this.fileName = data.fileName;
    this.mime = data.mime;
    this.sizeBytes = data.sizeBytes;
    this.contentHash = data.contentHash;
  }

  static create(data: NewFileBlob): FileBlob {
    if (!data.storageKey) throw new Error('FileBlob.create: storageKey requerido');
    const fileName = (data.fileName ?? '').replace(/\r\n|\r|\n/g, '').trim();
    if (fileName.length === 0) {
      throw new Error('FileBlob.create: fileName requerido (nombre del recurso para el usuario)');
    }
    const basename = fileName.split(/[\\/]/).pop() || fileName;
    if (data.sizeBytes <= 0) throw new Error('FileBlob.create: sizeBytes debe ser > 0');
    return new FileBlob({ ...data, fileName: basename });
  }
}
