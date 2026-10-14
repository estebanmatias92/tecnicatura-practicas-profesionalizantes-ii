// FR-004 / UC-002 [Controller] — UploadMaterialUseCase.execute() unico punto
// de entrada. Crea Material + FileBlob 1:1 nuevos por cada POST (Creator);
// duplicados -> 201 (BR-004). E-001: fallo tardio -> rollback (FS + blob).
import { createHash } from 'node:crypto';
import { Material } from '../entities/material.entity';
import { FileBlob } from '../entities/file-blob.entity';
import { Role } from '../entities/role';
import { DomainError } from './errors';
import type {
  MaterialRepository,
  FileBlobRepository,
  FileStorage,
  ValidatorPort,
  MaterialMeta,
  UploadedFile,
} from './ports';

export interface UploadInput {
  callerId: number;
  callerRole: Role;
  file: UploadedFile;
  meta: MaterialMeta;
}

export class UploadMaterialUseCase {
  constructor(
    private readonly validator: ValidatorPort,
    private readonly storage: FileStorage,
    private readonly materials: MaterialRepository,
    private readonly blobs: FileBlobRepository,
  ) {}

  async execute(input: UploadInput): Promise<Record<string, unknown>> {
    if (input.callerRole === Role.Student) throw new DomainError('FORBIDDEN', 'solo Professor/Admin sube material');
    this.validator.validateFile(input.file.mime, input.file.size);
    this.validator.validateMetadata(input.meta);
    const storageKey = await this.storage.store(input.file.buffer, input.file.originalName);
    const savedBlob = await this.blobs.save(
      FileBlob.create({
        storageKey,
        fileName: input.file.originalName,
        mime: input.file.mime,
        sizeBytes: input.file.size,
        contentHash: createHash('sha256').update(input.file.buffer).digest('hex'),
      }),
    );
    try {
      const saved = await this.materials.save(
        Material.create({ ...input.meta, ownerId: input.callerId, blobId: savedBlob.id as number }),
      );
      return saved.toPublic();
    } catch {
      await this.storage.remove(storageKey);
      await this.blobs.delete(savedBlob.id as number);
      throw new DomainError('INTERNAL', 'fallo al persistir material (rollback aplicado)');
    }
  }
}
