// UC-002/003/004/005/006 flujos con estado [e2e usecases + controllers].
// Mapea 1:1 a backend/tests/cases/UC-002..006.feature (ver test-cases.md).
// Reglas reales (BiblioValidator), repos/storage en memoria (fakes con estado).
// Lo ya cubierto a nivel unit (register/login/guards/matriz) vive en
// auth-matrix.spec.ts; la cascada C-1/C-2/C-3 vive en integration/cascade.spec.ts.
import { HttpException } from '@nestjs/common';
import { UploadMaterialUseCase } from '../../src/usecases/upload-material.usecase';
import { SearchCatalogUseCase } from '../../src/usecases/search-catalog.usecase';
import { ManageMaterialUseCase } from '../../src/usecases/manage-material.usecase';
import { DownloadFileUseCase } from '../../src/usecases/download-file.usecase';
import { MaterialsController } from '../../src/adapters/http/materials.controller';
import { Role } from '../../src/entities/role';
import { Material } from '../../src/entities/material.entity';
import { FileBlob } from '../../src/entities/file-blob.entity';
import { createWorld, pdfBytes, type World } from '../helpers/fakes';

const MAX_BYTES = 50 * 1024 * 1024;

const fileOf = (over: Partial<{ buffer: Buffer; mime: string; size: number; originalName: string }> = {}) => ({
  buffer: pdfBytes(),
  mime: 'application/pdf',
  size: 1024,
  originalName: 'redes.pdf',
  ...over,
});
const metaOf = (over: Record<string, unknown> = {}) => ({ title: 'Redes', author: 'Tanenbaum', ...over });

function setupUpload() {
  const w = createWorld();
  return { w, upload: new UploadMaterialUseCase(w.validator, w.storage, w.materials, w.blobs) };
}

/** Siembra material completo (blob + bytes + material) con dueno dado. */
async function seedMaterial(
  w: World,
  over: { title?: string; author?: string; ownerId?: number; mime?: string; fileName?: string; tags?: string[]; year?: number; subject?: string } = {},
) {
  const mime = over.mime ?? 'application/pdf';
  const fileName = over.fileName ?? 'redes.pdf';
  const key = await w.storage.store(pdfBytes(), fileName);
  const blob = await w.blobs.save(
    FileBlob.create({ storageKey: key, fileName, mime, sizeBytes: 1024, contentHash: 'seed' }),
  );
  return w.materials.save(
    Material.create({
      title: over.title ?? 'Redes',
      author: over.author ?? 'Tanenbaum',
      ownerId: over.ownerId ?? 3,
      blobId: blob.id as number,
      tags: over.tags,
      year: over.year,
      subject: over.subject,
    }),
  );
}

describe('UC-002 subir material (FR-004 + BR-004 + RST-005 + NFR-005)', () => {
  it('subida valida Professor crea Material + FileBlob 1-1', async () => {
    const { w, upload } = setupUpload();
    const out = (await upload.execute({
      callerId: 3,
      callerRole: Role.Professor,
      file: fileOf(),
      meta: metaOf(),
    })) as Record<string, unknown>;
    expect(out['id']).toBeDefined();
    expect(out['blobId']).toBeDefined();
    expect(out['ownerId']).toBe(3);
    expect(await w.materials.findById(out['id'] as number)).not.toBeNull();
    expect(await w.blobs.findById(out['blobId'] as number)).not.toBeNull();
  });

  it('subida valida con opcionales subject year edition tags', async () => {
    const { w, upload } = setupUpload();
    const out = (await upload.execute({
      callerId: 3,
      callerRole: Role.Professor,
      file: fileOf(),
      meta: metaOf({ subject: 'informatica', year: 2020, edition: '2da', tags: ['redes', 'ospf'] }),
    })) as Record<string, unknown>;
    const found = await w.materials.findById(out['id'] as number);
    expect(found).toMatchObject({ subject: 'informatica', year: 2020, edition: '2da', tags: ['redes', 'ospf'] });
  });

  it('Student intenta subir', async () => {
    const { w, upload } = setupUpload();
    await expect(
      upload.execute({ callerId: 7, callerRole: Role.Student, file: fileOf(), meta: metaOf() }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await w.materials.search({}, 1, 10)).total).toBe(0);
  });

  it('subida sin token es 401 antes de validar nada (MaterialsController.callerOf)', async () => {
    const w = createWorld();
    const controller = new MaterialsController(
      new UploadMaterialUseCase(w.validator, w.storage, w.materials, w.blobs),
      new SearchCatalogUseCase(w.materials),
      new ManageMaterialUseCase(w.users, w.materials, w.storage, w.validator),
      new DownloadFileUseCase(w.materials, w.blobs, w.storage),
    );
    const fakeMulter = { buffer: pdfBytes(), mimetype: 'application/pdf', size: 1024, originalname: 'r.pdf' };
    await expect(
      controller.uploadMaterial({ headers: {} } as never, fakeMulter as never, { title: 'T', author: 'A' } as never),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('MIME no permitido antes de persistir', async () => {
    const { w, upload } = setupUpload();
    await expect(
      upload.execute({ callerId: 3, callerRole: Role.Professor, file: fileOf({ mime: 'image/png' }), meta: metaOf() }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_MEDIA' });
    expect((await w.materials.search({}, 1, 10)).total).toBe(0);
  });

  it('archivo excede 50MB antes de persistir', async () => {
    const { w, upload } = setupUpload();
    await expect(
      upload.execute({
        callerId: 3,
        callerRole: Role.Professor,
        file: fileOf({ size: MAX_BYTES + 1 }),
        meta: metaOf(),
      }),
    ).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
    expect((await w.materials.search({}, 1, 10)).total).toBe(0);
  });

  it('archivo exactamente 50MB es aceptado (borde)', async () => {
    const { upload } = setupUpload();
    const out = (await upload.execute({
      callerId: 3,
      callerRole: Role.Professor,
      file: fileOf({ size: MAX_BYTES }),
      meta: metaOf(),
    })) as Record<string, unknown>;
    expect(out['id']).toBeDefined();
  });

  it('metadatos invalidos (titulo ausente)', async () => {
    const { w, upload } = setupUpload();
    await expect(
      upload.execute({ callerId: 3, callerRole: Role.Professor, file: fileOf(), meta: metaOf({ title: '' }) }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect((await w.materials.search({}, 1, 10)).total).toBe(0);
  });

  it('metadatos invalidos (anio fuera de rango)', async () => {
    const { w, upload } = setupUpload();
    await expect(
      upload.execute({ callerId: 3, callerRole: Role.Professor, file: fileOf(), meta: metaOf({ year: 999 }) }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect((await w.materials.search({}, 1, 10)).total).toBe(0);
  });

  it('metadatos invalidos (tags duplicados tras normalizar)', async () => {
    const { w, upload } = setupUpload();
    await expect(
      upload.execute({
        callerId: 3,
        callerRole: Role.Professor,
        file: fileOf(),
        meta: metaOf({ tags: ['Redes', 'redes'] }),
      }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect((await w.materials.search({}, 1, 10)).total).toBe(0);
  });

  it('binario duplicado crea dos recursos (BR-004, sin 409 por contenido)', async () => {
    const { w, upload } = setupUpload();
    const bytes = pdfBytes();
    const a = (await upload.execute({
      callerId: 3,
      callerRole: Role.Professor,
      file: fileOf({ buffer: bytes, originalName: 'a.pdf' }),
      meta: metaOf({ title: 'Copia A' }),
    })) as Record<string, unknown>;
    const b = (await upload.execute({
      callerId: 3,
      callerRole: Role.Professor,
      file: fileOf({ buffer: bytes, originalName: 'b.pdf' }),
      meta: metaOf({ title: 'Copia B' }),
    })) as Record<string, unknown>;
    expect(a['id']).not.toBe(b['id']);
    expect(a['blobId']).not.toBe(b['blobId']);
    expect((await w.materials.search({}, 1, 10)).total).toBe(2);
  });

  it('fallo de escritura en storage revierte metadatos (E-001)', async () => {
    const { w, upload } = setupUpload();
    w.storage.failOnStore = true;
    await expect(
      upload.execute({ callerId: 3, callerRole: Role.Professor, file: fileOf(), meta: metaOf() }),
    ).rejects.toThrow();
    expect((await w.materials.search({}, 1, 10)).total).toBe(0);
    expect(w.blobs.rows.size).toBe(0);
  });
});

describe('UC-003 leer material (FR-006/FR-007 + BR-002)', () => {
  it('Student lee material ajeno (todo rol autenticado ve todo)', async () => {
    const w = createWorld();
    const m = await seedMaterial(w, { ownerId: 8 });
    const search = new SearchCatalogUseCase(w.materials);
    expect(((await search.getById(m.id as number)) as Material).title).toBe('Redes');
  });

  it('catalogo con JWT devuelve envelope items/total/page/limit', async () => {
    const w = createWorld();
    await seedMaterial(w);
    const search = new SearchCatalogUseCase(w.materials);
    const out = await search.execute({ page: 1, limit: 10 });
    expect(out).toMatchObject({ total: 1, page: 1, limit: 10 });
    expect(out.items).toHaveLength(1);
  });

  it('material inexistente con JWT valido da 404', async () => {
    const w = createWorld();
    const search = new SearchCatalogUseCase(w.materials);
    await expect(search.getById(999999)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('UC-004 gestion no-cascada (FR-011/FR-013)', () => {
  function setupManage() {
    const w = createWorld();
    return { w, manage: new ManageMaterialUseCase(w.users, w.materials, w.storage, w.validator) };
  }

  it('Admin cambia rol de usuario', async () => {
    const { w, manage } = setupManage();
    const { User } = await import('../../src/entities/user.entity');
    const u = await w.users.save(User.create({ email: 'u@biblio.tech', passwordHash: 'h', role: Role.Student }));
    const out = (await manage.changeUserRole({ callerRole: Role.Admin, userId: u.id as number, role: Role.Professor })) as Record<
      string,
      unknown
    >;
    expect(out['role']).toBe(Role.Professor);
  });

  it('rol invalido da 400', async () => {
    const { w, manage } = setupManage();
    const { User } = await import('../../src/entities/user.entity');
    const u = await w.users.save(User.create({ email: 'u@biblio.tech', passwordHash: 'h', role: Role.Student }));
    await expect(
      manage.changeUserRole({ callerRole: Role.Admin, userId: u.id as number, role: 'Jefe' as Role }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('no-Admin intenta gestionar usuarios da 403', async () => {
    const { manage } = setupManage();
    await expect(manage.changeUserRole({ callerRole: Role.Professor, userId: 5, role: Role.Student })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(manage.listUsers(Role.Student)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('Professor edita material propio', async () => {
    const { w, manage } = setupManage();
    const m = await seedMaterial(w, { ownerId: 3, title: 'Viejo' });
    const out = (await manage.updateMaterial({
      callerId: 3,
      callerRole: Role.Professor,
      materialId: m.id as number,
      patch: { title: 'Redes v2' },
    })) as Record<string, unknown>;
    expect(out['title']).toBe('Redes v2');
  });

  it('Professor edita material ajeno da 403 y material intacto', async () => {
    const { w, manage } = setupManage();
    const m = await seedMaterial(w, { ownerId: 8, title: 'Ajeno' });
    await expect(
      manage.updateMaterial({ callerId: 3, callerRole: Role.Professor, materialId: m.id as number, patch: { title: 'hack' } }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await w.materials.findById(m.id as number))?.title).toBe('Ajeno');
  });

  it('borrado de usuario inexistente da 404', async () => {
    const { manage } = setupManage();
    await expect(deleteUserAs(manage, 999999)).rejects.toMatchObject({ code: 'NOT_FOUND' });

    async function deleteUserAs(
      mm: ManageMaterialUseCase,
      userId: number,
    ): Promise<void> {
      return mm.deleteUser({ callerId: 1, callerRole: Role.Admin, userId });
    }
  });

  it('lista Admin no expone passwordHash', async () => {
    const { w, manage } = setupManage();
    const { User } = await import('../../src/entities/user.entity');
    await w.users.save(User.create({ email: 'u@biblio.tech', passwordHash: '超 secreto', role: Role.Student }));
    const list = await manage.listUsers(Role.Admin);
    expect(JSON.stringify(list)).not.toContain('secreto');
  });
});

describe('UC-005 buscar y paginar (FR-009/FR-010)', () => {
  async function setupSearch() {
    const w = createWorld();
    await seedMaterial(w, { title: 'Redes de computadoras', author: 'Tanenbaum', ownerId: 3, tags: ['redes'], year: 2010 });
    await seedMaterial(w, { title: 'Redes OSPF avanzado', author: 'Moy', ownerId: 8, tags: ['redes', 'ospf'], year: 2015 });
    await seedMaterial(w, { title: 'Redes y seguridad', author: 'Stallings', ownerId: 9, tags: ['redes', 'seguridad'], year: 2020 });
    await seedMaterial(w, { title: 'Cocina facil', author: 'Otro', ownerId: 8, tags: ['cocina'], year: 2021 });
    return new SearchCatalogUseCase(w.materials);
  }

  it('busqueda por titulo como Student', async () => {
    const search = await setupSearch();
    const out = await search.execute({ q: 'redes' });
    expect(out.total).toBe(3);
  });

  it('q vacio no es error', async () => {
    const search = await setupSearch();
    const out = await search.execute({ q: '' });
    expect(out.total).toBe(4);
  });

  it('filtro por autor parcial case-insensitive', async () => {
    const search = await setupSearch();
    const out = await search.execute({ author: 'tanen' });
    expect(out.total).toBe(1);
  });

  it('filtro por tags multiples en AND', async () => {
    const search = await setupSearch();
    const out = await search.execute({ tags: ['redes', 'ospf'] });
    expect(out.total).toBe(1);
    expect(out.items[0]?.author).toBe('Moy');
  });

  it('filtro por rango de anios inclusivo', async () => {
    const search = await setupSearch();
    const out = await search.execute({ yearFrom: 2010, yearTo: 2015 });
    expect(out.total).toBe(2);
  });

  it('rango de anios invalido da 400', async () => {
    const search = await setupSearch();
    await expect(search.execute({ yearFrom: 2020, yearTo: 2010 })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('limite excede maximo da 400', async () => {
    const search = await setupSearch();
    await expect(search.execute({ limit: 1000 })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('pagina cero es error (borde 0/1)', async () => {
    const search = await setupSearch();
    await expect(search.execute({ page: 0, limit: 10 })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('parametros nulos usan defaults page 1 limit 10', async () => {
    const w = createWorld();
    for (let i = 0; i < 25; i++) await seedMaterial(w, { title: `Libro ${i}` });
    const search = new SearchCatalogUseCase(w.materials);
    const out = await search.execute({});
    expect(out).toMatchObject({ total: 25, page: 1, limit: 10 });
    expect(out.items).toHaveLength(10);
  });

  it('paginacion segunda pagina', async () => {
    const w = createWorld();
    for (let i = 0; i < 25; i++) await seedMaterial(w, { title: `Libro ${i}` });
    const search = new SearchCatalogUseCase(w.materials);
    const out = await search.execute({ page: 2, limit: 10 });
    expect(out).toMatchObject({ total: 25, page: 2, limit: 10 });
    expect(out.items).toHaveLength(10);
  });
});

describe('UC-006 descargar archivo (FR-008)', () => {
  function setupDownload(w: World) {
    return new DownloadFileUseCase(w.materials, w.blobs, w.storage);
  }

  it('descarga PDF con JWT (mime + filename para Content-Disposition inline)', async () => {
    const w = createWorld();
    const m = await seedMaterial(w, { mime: 'application/pdf', fileName: 'redes.pdf' });
    const out = await setupDownload(w).execute({ materialId: m.id as number });
    expect(out.mime).toBe('application/pdf');
    expect(out.fileName).toBe('redes.pdf');
    expect(out.stream).toBeDefined();
  });

  it('descarga EPUB preserva tipo y nombre', async () => {
    const w = createWorld();
    const m = await seedMaterial(w, { mime: 'application/epub+zip', fileName: 'libro.epub' });
    const out = await setupDownload(w).execute({ materialId: m.id as number });
    expect(out.mime).toBe('application/epub+zip');
    expect(out.fileName).toBe('libro.epub');
  });

  it('id inexistente con token valido da 404', async () => {
    const w = createWorld();
    await expect(setupDownload(w).execute({ materialId: 999999 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('binario huerfano (metadatos sin archivo) da 500 con log', async () => {
    const w = createWorld();
    const orphan = await w.materials.save(
      Material.create({ title: 'Huerfano', author: 'X', ownerId: 3, blobId: 999999 }),
    );
    const err = await setupDownload(w)
      .execute({ materialId: orphan.id as number })
      .catch((e: unknown) => e);
    expect(err).toMatchObject({ code: 'INTERNAL' });
    expect((err as Error).message).toMatch(/huerfano/);
  });

  it('storage caido propaga el error (gap: el 503 especificado requiere codigo SERVICE_UNAVAILABLE — ver BUG-002)', async () => {
    const w = createWorld();
    const m = await seedMaterial(w);
    w.storage.failOnStream = true;
    const err = await setupDownload(w)
      .execute({ materialId: m.id as number })
      .catch((e: unknown) => e);
    // Comportamiento actual: el error crudo del driver sube sin mapear a HTTP.
    // El usecase no lo convierte a DomainError, asi que toHttp lo re-lanza tal cual
    // (Nest lo serializa como 500 generico, no 503). Divergencia registrada en bug-report.
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(HttpException);
  });
});

describe('MaterialsController borde HTTP (UC-002/003/004/005)', () => {
  function setupController(w: World) {
    return new MaterialsController(
      new UploadMaterialUseCase(w.validator, w.storage, w.materials, w.blobs),
      new SearchCatalogUseCase(w.materials),
      new ManageMaterialUseCase(w.users, w.materials, w.storage, w.validator),
      new DownloadFileUseCase(w.materials, w.blobs, w.storage),
    );
  }
  const reqAs = (userId: number, role: Role) =>
    ({ headers: { authorization: 'Bearer x' }, user: { userId, role } }) as never;

  it('catalog parsea query string (page/limit/tag repetido) y devuelve envelope', async () => {
    const w = createWorld();
    await seedMaterial(w, { tags: ['redes', 'ospf'] });
    const controller = setupController(w);
    const out = (await controller.catalog({ page: '2', limit: '10', tag: ['redes', 'ospf'] })) as Record<string, unknown>;
    expect(out).toMatchObject({ total: 1, page: 2, limit: 10 });
    expect(out['items']).toHaveLength(0); // pagina 2 vacia con 1 item total
  });

  it('getOne inexistente mapea a 404', async () => {
    const w = createWorld();
    await expect(setupController(w).getOne(999999)).rejects.toMatchObject({ status: 404 });
  });

  it('updateOne propio devuelve 200 con cambios', async () => {
    const w = createWorld();
    const m = await seedMaterial(w, { ownerId: 3 });
    const out = (await setupController(w).updateOne(reqAs(3, Role.Professor), m.id as number, {
      title: 'Nuevo',
    } as never)) as Record<string, unknown>;
    expect(out['title']).toBe('Nuevo');
  });

  it('updateOne ajeno como Professor da 403', async () => {
    const w = createWorld();
    const m = await seedMaterial(w, { ownerId: 8 });
    await expect(setupController(w).updateOne(reqAs(3, Role.Professor), m.id as number, { title: 'x' } as never)).rejects.toMatchObject(
      { status: 403 },
    );
  });

  it('deleteOne sin user da 401', async () => {
    const w = createWorld();
    const m = await seedMaterial(w, { ownerId: 3 });
    await expect(setupController(w).deleteOne({ headers: {} } as never, m.id as number)).rejects.toMatchObject({
      status: 401,
    });
  });

  it('deleteOne propio resuelve (ruta del 204)', async () => {
    const w = createWorld();
    const m = await seedMaterial(w, { ownerId: 3 });
    await expect(setupController(w).deleteOne(reqAs(3, Role.Professor), m.id as number)).resolves.toBeUndefined();
    expect(await w.materials.findById(m.id as number)).toBeNull();
  });

  it('upload sin file da 400', async () => {
    const w = createWorld();
    const controller = setupController(w);
    await expect(
      controller.uploadMaterial(reqAs(3, Role.Professor), undefined as never, { title: 'T', author: 'A' } as never),
    ).rejects.toMatchObject({ status: 400 });
  });
});
