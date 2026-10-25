export interface StoredFile {
  storageKey: string;
  sizeBytes: number;
}

export interface FileStorage {
  save(buffer: Buffer, originalName: string, mimeType: string): Promise<StoredFile>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}

export const FILE_STORAGE = Symbol('FILE_STORAGE');
