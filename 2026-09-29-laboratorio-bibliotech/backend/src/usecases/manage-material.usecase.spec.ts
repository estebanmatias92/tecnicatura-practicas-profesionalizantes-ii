// FR-011/FR-012/FR-013 / UC-004 [Controller] — ManageMaterialUseCase con un
// metodo por flujo C-1/C-2/C-3 (High Cohesion, no God-controller). Ownership
// via Material.isOwnedBy (Information Expert). TDD Slice 3 (RED).
import { ManageMaterialUseCase } from './manage-material.usecase';
import { Role } from '../entities/role';
import { Material } from '../entities/material.entity';
import { User } from '../entities/user.entity';
import type { UserRepository, MaterialRepository, FileStorage, ValidatorPort } from './ports';

function setup(ownedByCaller: boolean) {
  const materials: MaterialRepository = {
    save: jest.fn().mockImplementation((m: object) => Promise.resolve(m)),
    findById: jest.fn().mockResolvedValue(
      ownedByCaller ? { id: 1, ownerId: 3, blobId: 9, isOwnedBy: (id: number) => id === 3 } : null,
    ),
    search: jest.fn(),
    deleteWithBlob: jest.fn().mockResolvedValue({ storageKey: 'k' }),
  };
  const users: UserRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn().mockResolvedValue({ id: 3, toPublic: () => ({ id: 3 }) }),
    findAll: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockImplementation((u: object) => Promise.resolve(u)),
    deleteCascade: jest.fn().mockResolvedValue(['k1', 'k2']),
  };
  const storage: FileStorage = { store: jest.fn(), stream: jest.fn(), remove: jest.fn().mockResolvedValue(undefined) };
  const validator: ValidatorPort = { validateEmail: jest.fn(), validatePassword: jest.fn(), validateMetadata: jest.fn(), validateFile: jest.fn() };
  return { uc: new ManageMaterialUseCase(users, materials, storage, validator), users, materials, storage, validator };
}

beforeEach(() => jest.clearAllMocks());

describe('ManageMaterialUseCase (UC-004 cascada BR-004)', () => {
  it('C-1: Professor borra material propio -> 204 (repo + storage)', async () => {
    const { uc, materials, storage } = setup(true);
    await uc.deleteMaterial({ callerId: 3, callerRole: Role.Professor, materialId: 1 });
    expect(materials.deleteWithBlob).toHaveBeenCalledWith(1);
    expect(storage.remove).toHaveBeenCalledWith('k');
  });

  it('C-1a: Professor borra material ajeno -> 403 y nada eliminado', async () => {
    const { uc, materials, storage } = setup(false);
    (materials.findById as jest.Mock).mockResolvedValue(
      Material.create({ title: 'T', author: 'A', ownerId: 8, blobId: 9 }),
    );
    await expect(
      uc.deleteMaterial({ callerId: 3, callerRole: Role.Professor, materialId: 1 }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(materials.deleteWithBlob).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it('C-3: Admin borra material ajeno -> 204', async () => {
    const { uc, materials } = setup(false);
    (materials.findById as jest.Mock).mockResolvedValue({ id: 1, ownerId: 8, blobId: 9, isOwnedBy: () => false });
    await uc.deleteMaterial({ callerId: 1, callerRole: Role.Admin, materialId: 1 });
    expect(materials.deleteWithBlob).toHaveBeenCalledWith(1);
  });

  it('C-2: Admin borra cuenta Professor -> cascada + limpieza de blobs', async () => {
    const { uc, users, storage } = setup(true);
    await uc.deleteUser({ callerId: 1, callerRole: Role.Admin, userId: 3 });
    expect(users.deleteCascade).toHaveBeenCalledWith(3);
    expect(storage.remove).toHaveBeenCalledWith('k1');
    expect(storage.remove).toHaveBeenCalledWith('k2');
  });

  it('no-Admin borra cuenta -> 403 y nada eliminado', async () => {
    const { uc, users } = setup(true);
    await expect(uc.deleteUser({ callerId: 3, callerRole: Role.Professor, userId: 4 })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    expect(users.deleteCascade).not.toHaveBeenCalled();
  });

  it('FR-013: Professor edita material propio -> 200 con cambios', async () => {
    const { uc, materials } = setup(true);
    (materials.findById as jest.Mock).mockResolvedValue(
      Material.create({ title: 'Viejo', author: 'A', ownerId: 3, blobId: 9 }),
    );
    const out = (await uc.updateMaterial({
      callerId: 3,
      callerRole: Role.Professor,
      materialId: 1,
      patch: { title: 'Nuevo' },
    })) as Record<string, unknown>;
    expect(out['title']).toBe('Nuevo');
  });

  it('Professor edita material ajeno -> 403 y nada guardado', async () => {
    const { uc, materials } = setup(false);
    (materials.findById as jest.Mock).mockResolvedValue(
      Object.assign(Material.create({ title: 'T', author: 'A', ownerId: 8, blobId: 9 }), { id: 1 }),
    );
    await expect(
      uc.updateMaterial({ callerId: 3, callerRole: Role.Professor, materialId: 1, patch: { title: 'X' } }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(materials.save).not.toHaveBeenCalled();
  });

  it('Admin edita material ajeno -> 200', async () => {
    const { uc, materials } = setup(false);
    (materials.findById as jest.Mock).mockResolvedValue(
      Material.create({ title: 'T', author: 'A', ownerId: 8, blobId: 9 }),
    );
    const out = (await uc.updateMaterial({
      callerId: 1,
      callerRole: Role.Admin,
      materialId: 1,
      patch: { year: 2021 },
    })) as Record<string, unknown>;
    expect(out['year']).toBe(2021);
  });

  it('Admin lista usuarios sin passwordHash; no-Admin -> 403', async () => {
    const { uc, users } = setup(true);
    (users.findAll as jest.Mock).mockResolvedValue([
      User.create({ email: 'a@b.c', passwordHash: 'h', role: Role.Student }),
    ]);
    const list = await uc.listUsers(Role.Admin);
    expect(JSON.stringify(list)).not.toContain('h');
    await expect(uc.listUsers(Role.Student)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('Admin cambia rol -> 200; rol invalido -> 400; no-Admin -> 403', async () => {
    const { uc, users } = setup(true);
    const target = User.create({ email: 'p@b.c', passwordHash: 'h', role: Role.Student });
    (users.findById as jest.Mock).mockResolvedValue(target);
    await uc.changeUserRole({ callerRole: Role.Admin, userId: 3, role: Role.Professor });
    expect(target.role).toBe(Role.Professor);
    await expect(
      uc.changeUserRole({ callerRole: Role.Admin, userId: 3, role: 'Jefe' as Role }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(
      uc.changeUserRole({ callerRole: Role.Student, userId: 3, role: Role.Admin }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
