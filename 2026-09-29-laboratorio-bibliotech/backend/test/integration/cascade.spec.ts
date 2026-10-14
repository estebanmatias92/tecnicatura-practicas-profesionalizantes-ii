// UC-004 cascada C-1/C-2/C-3 + E-001 [integration con estado].
// Mapea a backend/tests/cases/UC-004.feature (escenarios de borrado).
// Fakes transaccionales en memoria. Variante DB-backed (TypeOrm + MariaDB 11)
// pendiente como todos explícitos (GAP-002) — misma matriz contra el driver real.
import { ManageMaterialUseCase } from '../../src/usecases/manage-material.usecase';
import { User } from '../../src/entities/user.entity';
import { Role } from '../../src/entities/role';
import { createWorld, type World } from '../helpers/fakes';

async function seedProfessorWithMaterials(w: World, email: string, n: number) {
  const user = await w.users.save(User.create({ email, passwordHash: 'h', role: Role.Professor }));
  const ownerId = user.id as number;
  const keys: string[] = [];
  for (let i = 0; i < n; i++) {
    const key = await w.storage.store(Buffer.from(`bytes-${i}`), `libro-${i}.pdf`);
    keys.push(key);
    const { FileBlob } = await import('../../src/entities/file-blob.entity');
    const blob = await w.blobs.save(FileBlob.create({ storageKey: key, fileName: `libro-${i}.pdf`, mime: 'application/pdf', sizeBytes: 8 }));
    const { Material } = await import('../../src/entities/material.entity');
    await w.materials.save(Material.create({ title: `Libro ${i}`, author: 'A', ownerId, blobId: blob.id as number }));
  }
  return { user, ownerId, keys };
}

function setupCascade() {
  const w = createWorld();
  return { w, manage: new ManageMaterialUseCase(w.users, w.materials, w.storage, w.validator) };
}

describe('UC-004 cascada en memoria (BR-004 C-1/C-2/C-3)', () => {
  it('C-3: Admin elimina material ajeno mas su blob', async () => {
    const { w, manage } = setupCascade();
    const admin = await w.users.save(User.create({ email: 'admin@biblio.tech', passwordHash: 'h', role: Role.Admin }));
    const { ownerId, keys } = await seedProfessorWithMaterials(w, 'p@biblio.tech', 1);
    expect(ownerId).not.toBe(admin.id);
    const mid = (await w.materials.search({}, 1, 10)).items[0]?.id as number;
    await manage.deleteMaterial({ callerId: admin.id as number, callerRole: Role.Admin, materialId: mid });
    expect(await w.materials.findById(mid)).toBeNull();
    expect(w.blobs.rows.size).toBe(0);
    expect(w.storage.files.has(keys[0] as string)).toBe(false);
  });

  it('C-1: Professor elimina material propio mas su blob', async () => {
    const { w, manage } = setupCascade();
    const { ownerId } = await seedProfessorWithMaterials(w, 'p@biblio.tech', 1);
    const mid = (await w.materials.search({}, 1, 10)).items[0]?.id as number;
    await manage.deleteMaterial({ callerId: ownerId, callerRole: Role.Professor, materialId: mid });
    expect(await w.materials.findById(mid)).toBeNull();
    expect(w.blobs.rows.size).toBe(0);
    expect(w.storage.files.size).toBe(0);
  });

  it('C-1a: Professor elimina material ajeno da 403 y material intacto', async () => {
    const { w, manage } = setupCascade();
    await seedProfessorWithMaterials(w, 'p@biblio.tech', 1);
    const mid = (await w.materials.search({}, 1, 10)).items[0]?.id as number;
    await expect(
      manage.deleteMaterial({ callerId: 999, callerRole: Role.Professor, materialId: mid }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(await w.materials.findById(mid)).not.toBeNull();
    expect(w.blobs.rows.size).toBe(1);
  });

  it('C-2: borrado de cuenta Professor con 2 materiales arrastra todo', async () => {
    const { w, manage } = setupCascade();
    const { user } = await seedProfessorWithMaterials(w, 'p@biblio.tech', 2);
    await manage.deleteUser({ callerId: 1, callerRole: Role.Admin, userId: user.id as number });
    expect(await w.users.findById(user.id as number)).toBeNull();
    expect((await w.materials.search({}, 1, 10)).total).toBe(0);
    expect(w.blobs.rows.size).toBe(0);
    expect(w.storage.files.size).toBe(0);
  });

  it('C-2: borrado de cuenta Professor sin material', async () => {
    const { w, manage } = setupCascade();
    const user = await w.users.save(User.create({ email: 'solo@biblio.tech', passwordHash: 'h', role: Role.Professor }));
    await expect(
      manage.deleteUser({ callerId: 1, callerRole: Role.Admin, userId: user.id as number }),
    ).resolves.toBeUndefined();
    expect(await w.users.findById(user.id as number)).toBeNull();
  });

  it('E-001 material: fallo al borrar blob propaga el error (gap: la DB ya muto — sin rollback, ver BUG-001)', async () => {
    const { w, manage } = setupCascade();
    await seedProfessorWithMaterials(w, 'p@biblio.tech', 1);
    const mid = (await w.materials.search({}, 1, 10)).items[0]?.id as number;
    w.storage.failOnRemove = true;
    await expect(manage.deleteMaterial({ callerId: 1, callerRole: Role.Admin, materialId: mid })).rejects.toThrow(/EIO/);
    // Divergencia con UC-004 E-001 ("rollback: nada eliminado"): deleteWithBlob corre
    // antes que storage.remove, asi que el material+blob ya salieron de la DB.
    expect(await w.materials.findById(mid)).toBeNull();
  });

  it('E-001 usuario: fallo al limpiar FS propaga el error (gap: la DB ya muto — sin rollback, ver BUG-001)', async () => {
    const { w, manage } = setupCascade();
    const { user } = await seedProfessorWithMaterials(w, 'p@biblio.tech', 1);
    w.storage.failOnRemove = true;
    await expect(
      manage.deleteUser({ callerId: 1, callerRole: Role.Admin, userId: user.id as number }),
    ).rejects.toThrow(/EIO/);
    expect(await w.users.findById(user.id as number)).toBeNull();
  });
});

describe('UC-004 cascada DB-backed TypeOrm + MariaDB 11 (GAP-002, pendiente)', () => {
  it.todo('C-1/C-3 contra TypeOrmMaterialRepository con docker compose db healthy');
  it.todo('C-2 contra TypeOrmUserRepository: cuenta + N materials + blobs + archivos reales en UPLOAD_DIR');
  it.todo('E-001 con transaccion TypeORM: fallo de FS revierte DB (criterio de aceptacion del BUG-001)');
});
