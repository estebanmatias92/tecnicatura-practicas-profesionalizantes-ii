// FR-004 / UC-002 [Controller] — UploadMaterialUseCase.execute() unico punto
// de entrada; crea Material + FileBlob 1:1 nuevos por cada POST (Creator).
// TDD Slice 2 (RED).
import { UploadMaterialUseCase } from './upload-material.usecase';
import { Role } from '../entities/role';
import type {
  MaterialRepository,
  FileBlobRepository,
  FileStorage,
  ValidatorPort,
} from './ports';

function setup() {
  const validator: ValidatorPort = {
    validateEmail: jest.fn(),
    validatePassword: jest.fn(),
    validateMetadata: jest.fn(),
    validateFile: jest.fn(),
    normalizeFileName: jest.fn(),
  };
  const storage: FileStorage = {
    store: jest.fn().mockResolvedValue('stored-key-1'),
    stream: jest.fn(),
    remove: jest.fn(),
  };
  const materials: MaterialRepository = {
    save: jest.fn().mockImplementation((m: object) => Promise.resolve(Object.assign(m, { id: 11 }))),
    findById: jest.fn(),
    search: jest.fn(),
    deleteWithBlob: jest.fn(),
  };
  const blobs: FileBlobRepository = {
    save: jest.fn().mockImplementation((b: unknown) => Promise.resolve({ ...(b as object), id: 22 })),
    delete: jest.fn(),
    findById: jest.fn(),
  };
  return { uc: new UploadMaterialUseCase(validator, storage, materials, blobs), validator, storage, materials, blobs };
}

beforeEach(() => jest.clearAllMocks());

const file = { buffer: Buffer.from('PDF'), mime: 'application/pdf', size: 3, originalName: 'redes.pdf' };
const meta = { title: 'Redes', author: 'Tanenbaum' };

describe('UploadMaterialUseCase (FR-004 / UC-002)', () => {
  it('Professor valido -> 201 con material consultable (sin bytes)', async () => {
    const { uc } = setup();
    const out = await uc.execute({ callerId: 3, callerRole: Role.Professor, file, meta });
    expect(out.id).toBe(11);
    expect(out).not.toHaveProperty('bytes');
    expect(out).not.toHaveProperty('buffer');
  });

  it('Student -> 403 FORBIDDEN y nada persistido', async () => {
    const { uc, materials, storage } = setup();
    await expect(
      uc.execute({ callerId: 9, callerRole: Role.Student, file, meta }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(storage.store).not.toHaveBeenCalled();
    expect(materials.save).not.toHaveBeenCalled();
  });

  it('MIME/tamano invalido -> rechazo del Validator y nada persistido (NFR-005)', async () => {
    const { uc, validator, storage, materials } = setup();
    (validator.validateFile as jest.Mock).mockImplementationOnce(() => {
      throw Object.assign(new Error('too big'), { code: 'PAYLOAD_TOO_LARGE' });
    });
    await expect(uc.execute({ callerId: 3, callerRole: Role.Professor, file, meta })).rejects.toMatchObject({
      code: 'PAYLOAD_TOO_LARGE',
    });
    expect(storage.store).not.toHaveBeenCalled();
    expect(materials.save).not.toHaveBeenCalled();
  });

  it('bytes duplicados -> 201 con ids nuevos (BR-004, nunca 409 por contenido)', async () => {
    const { uc, materials } = setup();
    let nextId = 11;
    (materials.save as jest.Mock).mockImplementation((m: object) =>
      Promise.resolve(Object.assign(m, { id: nextId++ })),
    );
    const first = await uc.execute({ callerId: 3, callerRole: Role.Professor, file, meta });
    const second = await uc.execute({ callerId: 3, callerRole: Role.Professor, file, meta });
    expect(first.id).toBe(11);
    expect(second.id).toBe(12);
  });
});
