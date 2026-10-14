// FR-007/FR-008 / UC-006 [Controller] — entrega bytes del original con su
// nombre (fileName, decision stakeholder 2026-10-14). Material inexistente
// -> 404; blob ausente -> 500 huerfano (inconsistencia, UC-006 3b).
// Auth primero (BR-002): el guard frena sin JWT antes de llegar aqui.
import { DomainError } from './errors';
import type { MaterialRepository, FileBlobRepository, FileStorage } from './ports';

export interface FileDownload {
  stream: unknown;
  mime: string;
  fileName: string;
}

export class DownloadFileUseCase {
  constructor(
    private readonly materials: MaterialRepository,
    private readonly blobs: FileBlobRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(input: { materialId: number }): Promise<FileDownload> {
    const material = await this.materials.findById(input.materialId);
    if (!material || material.blobId === undefined) throw new DomainError('NOT_FOUND', 'material inexistente');
    const blob = await this.blobs.findById(material.blobId);
    if (!blob) throw new DomainError('INTERNAL', 'binario huerfano (inconsistencia)');
    return { stream: this.storage.stream(blob.storageKey), mime: blob.mime, fileName: blob.fileName };
  }
}
