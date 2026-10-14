// FR-007/FR-008 / UC-006 [Controller] — DownloadFileUseCase con puertos
// reales (Material + FileBlob + Storage). TDD: reescrito tras fallo
// stakeholder 2026-10-14 (fileName = nombre del recurso para el usuario).
import { DownloadFileUseCase } from './download-file.usecase';
import { Material } from '../entities/material.entity';
import { FileBlob } from '../entities/file-blob.entity';
import type { MaterialRepository, FileBlobRepository, FileStorage } from './ports';

function setup(material: Material | null, blob: FileBlob | null) {
  const materials: MaterialRepository = {
    save: jest.fn(),
    findById: jest.fn().mockResolvedValue(material),
    search: jest.fn(),
    deleteWithBlob: jest.fn(),
  };
  const blobs: FileBlobRepository = {
    save: jest.fn(),
    findById: jest.fn().mockResolvedValue(blob),
    delete: jest.fn(),
  };
  const storage: FileStorage = {
    store: jest.fn(),
    stream: jest.fn().mockReturnValue('STREAM'),
    remove: jest.fn(),
  };
  return { uc: new DownloadFileUseCase(materials, blobs, storage), storage };
}

const material = Object.assign(Material.create({ title: 'Redes', author: 'T', ownerId: 3, blobId: 9 }), { id: 1 });
const blob = Object.assign(
  FileBlob.create({ storageKey: 'abc.bin', fileName: 'redes.pdf', mime: 'application/pdf', sizeBytes: 100 }),
  { id: 9 },
);

describe('DownloadFileUseCase (FR-008 / UC-006)', () => {
  it('material existente -> stream con mime y filename original (inline)', async () => {
    const { uc, storage } = setup(material, blob);
    const out = await uc.execute({ materialId: 1 });
    expect(out).toEqual({ stream: 'STREAM', mime: 'application/pdf', fileName: 'redes.pdf' });
    expect(storage.stream).toHaveBeenCalledWith('abc.bin');
  });

  it('material inexistente -> 404 NOT_FOUND', async () => {
    const { uc } = setup(null, null);
    await expect(uc.execute({ materialId: 999 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('blob ausente (huerfano) -> 500 INTERNAL (UC-006 3b)', async () => {
    const { uc } = setup(material, null);
    await expect(uc.execute({ materialId: 1 })).rejects.toMatchObject({ code: 'INTERNAL' });
  });
});
