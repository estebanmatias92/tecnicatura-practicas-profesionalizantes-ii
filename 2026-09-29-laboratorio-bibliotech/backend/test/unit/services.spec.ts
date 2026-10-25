import { Role, Visibility } from '../../src/model/entities/enums';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../src/model/errors';
import { AuthService } from '../../src/model/services/auth.service';
import { MaterialService } from '../../src/model/services/material.service';
import { UserService } from '../../src/model/services/user.service';
import {
  FakeFileStorage,
  FakePasswordHasher,
  FakeTokenService,
  FixedClock,
  InMemoryMaterialRepository,
  InMemoryUserRepository,
  makeMaterial,
  makeUser,
} from '../fakes';

const now = new Date('2026-01-01T00:00:00.000Z');
const pdf = {
  originalName: 'apunte.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 8,
  buffer: Buffer.from('%PDF-1.4'),
};

function setup() {
  const users = new InMemoryUserRepository();
  const materials = new InMemoryMaterialRepository();
  const storage = new FakeFileStorage();
  const hasher = new FakePasswordHasher();
  const tokens = new FakeTokenService();
  const clock = new FixedClock(now);
  return {
    users,
    materials,
    storage,
    hasher,
    tokens,
    clock,
    auth: new AuthService(users, hasher, tokens, clock),
    userService: new UserService(users, hasher, clock),
    materialService: new MaterialService(materials, storage, clock, {
      maxFileSizeBytes: 10 * 1024 * 1024,
    }),
  };
}

let ctx: ReturnType<typeof setup>;

beforeEach(() => {
  ctx = setup();
});

describe('AuthService', () => {
  it('registers students and issues a token', async () => {
    const result = await ctx.auth.register(' Ana@Bibliotech.Local ', 'Secret1234!');

    expect(result.user.email).toBe('ana@bibliotech.local');
    expect(result.user.role).toBe(Role.STUDENT);
    expect(result.accessToken).toBeTruthy();
    expect(await ctx.users.findByEmail('ana@bibliotech.local')).toBe(result.user);
  });

  it('rejects duplicate and invalid registrations', async () => {
    await ctx.auth.register('ana@bibliotech.local', 'Secret1234!');
    await expect(ctx.auth.register('ANA@bibliotech.local', 'Secret1234!')).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(ctx.auth.register('no-email', 'Secret1234!')).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(ctx.auth.register('a@b.com', 'short')).rejects.toBeInstanceOf(ValidationError);
  });

  it('logs in with valid credentials', async () => {
    await ctx.auth.register('ana@bibliotech.local', 'Secret1234!');
    const result = await ctx.auth.login(' ANA@bibliotech.local ', 'Secret1234!');
    expect(result.user.email).toBe('ana@bibliotech.local');
    expect(result.accessToken).toBeTruthy();
  });

  it('rejects unknown users, wrong passwords and empty passwords', async () => {
    await ctx.auth.register('ana@bibliotech.local', 'Secret1234!');
    await expect(ctx.auth.login('otra@bibliotech.local', 'Secret1234!')).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    await expect(ctx.auth.login('ana@bibliotech.local', 'incorrecta')).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    await expect(ctx.auth.login('ana@bibliotech.local', '')).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('authenticates valid sessions and rejects stale or unknown ones', async () => {
    const { user, accessToken } = await ctx.auth.register('ana@bibliotech.local', 'Secret1234!');
    expect((await ctx.auth.authenticate(accessToken)).id).toBe(user.id);

    const stale = ctx.tokens.sign({ sub: user.id, email: user.email, role: user.role, ver: 99 });
    await expect(ctx.auth.authenticate(stale)).rejects.toBeInstanceOf(UnauthorizedError);

    const unknown = ctx.tokens.sign({
      sub: 'missing',
      email: 'missing@bibliotech.local',
      role: Role.STUDENT,
      ver: 0,
    });
    await expect(ctx.auth.authenticate(unknown)).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(ctx.auth.authenticate('not-a-token')).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe('UserService', () => {
  it('lists and creates users with normalized emails', async () => {
    const created = await ctx.userService.create({
      email: ' Profe@Bibliotech.Local ',
      password: 'Secret1234!',
      role: 'PROFESSOR',
    });

    expect(created.email).toBe('profe@bibliotech.local');
    expect(created.role).toBe(Role.PROFESSOR);
    expect(created.passwordHash).toBe('hash:Secret1234!');
    expect(await ctx.userService.list()).toHaveLength(1);
  });

  it('rejects duplicates and invalid data', async () => {
    await ctx.userService.create({
      email: 'profe@bibliotech.local',
      password: 'Secret1234!',
      role: 'PROFESSOR',
    });
    await expect(
      ctx.userService.create({
        email: 'profe@bibliotech.local',
        password: 'Secret1234!',
        role: 'STUDENT',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      ctx.userService.create({ email: 'a@b.com', password: 'Secret1234!', role: 'ROOT' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('changes roles and invalidates tokens', async () => {
    const admin = makeUser(Role.ADMIN, { id: 'admin' });
    const target = await ctx.userService.create({
      email: 'profe@bibliotech.local',
      password: 'Secret1234!',
      role: 'PROFESSOR',
    });

    const updated = await ctx.userService.updateRole(target.id, 'ADMIN', admin);
    expect(updated.role).toBe(Role.ADMIN);
    expect(updated.tokenVersion).toBe(1);
  });

  it('prevents self role changes and unknown users', async () => {
    const admin = makeUser(Role.ADMIN, { id: 'admin' });
    await expect(ctx.userService.updateRole(admin.id, 'STUDENT', admin)).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(
      ctx.userService.updateRole('missing', 'STUDENT', admin),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('MaterialService', () => {
  const professor = makeUser(Role.PROFESSOR);
  const student = makeUser(Role.STUDENT, { id: 'student' });
  const admin = makeUser(Role.ADMIN, { id: 'admin' });

  it('creates drafts for Professor and Admin only', async () => {
    const draft = await ctx.materialService.createDraft({ title: '  Título  ' }, professor);
    expect(draft.title).toBe('Título');
    expect(draft.visibility).toBe(Visibility.OCULTO);
    expect(draft.isDraft()).toBe(true);

    await expect(
      ctx.materialService.createDraft({ title: 'X' }, student),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(ctx.materialService.createDraft({}, professor)).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(await ctx.materialService.createDraft({ title: 'Admin' }, admin)).toBeTruthy();
  });

  it('updates owned materials and rejects foreign or missing ones', async () => {
    const draft = await ctx.materialService.createDraft({ title: 'Original' }, professor);
    const updated = await ctx.materialService.update(draft.id, { title: 'Nuevo' }, professor);
    expect(updated.title).toBe('Nuevo');

    const other = makeUser(Role.PROFESSOR, { id: 'other' });
    await expect(
      ctx.materialService.update(draft.id, { title: 'Robado' }, other),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      ctx.materialService.update('missing', { title: 'X' }, professor),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('attaches files, replaces previous ones and cleans up on failure', async () => {
    const draft = await ctx.materialService.createDraft({ title: 'T' }, professor);
    const first = await ctx.materialService.attachFile(draft.id, pdf, professor);
    expect(first.file?.originalName).toBe('apunte.pdf');
    expect(first.file?.mimeType).toBe('application/pdf');

    const previous = first.file;
    const second = await ctx.materialService.attachFile(
      draft.id,
      { ...pdf, originalName: 'otro.pdf' },
      professor,
    );
    expect(second.file?.originalName).toBe('otro.pdf');
    expect(ctx.storage.deleted).toContain(previous?.storageKey);
    expect(ctx.materials.deletedBlobs).toContain(previous?.id);

    const third = await ctx.materialService.createDraft({ title: 'Fallo' }, professor);
    ctx.materials.failNextSave = true;
    await expect(ctx.materialService.attachFile(third.id, pdf, professor)).rejects.toThrow(
      'fallo de persistencia',
    );
    expect(ctx.storage.deleted).toContain('key-3-apunte.pdf');
  });

  it('publishes and hides materials', async () => {
    const draft = await ctx.materialService.createDraft({ title: 'T', author: 'A' }, professor);
    await expect(ctx.materialService.publish(draft.id, professor)).rejects.toBeInstanceOf(
      ValidationError,
    );

    await ctx.materialService.attachFile(draft.id, pdf, professor);
    const published = await ctx.materialService.publish(draft.id, professor);
    expect(published.visibility).toBe(Visibility.PUBLICO);
    expect(published.publishedAt).toEqual(now);

    const hidden = await ctx.materialService.hide(draft.id, professor);
    expect(hidden.visibility).toBe(Visibility.OCULTO);
    expect(hidden.publishedAt).toEqual(now);
  });

  it('soft deletes and restores with admin rules', async () => {
    const draft = await ctx.materialService.createDraft({ title: 'T' }, professor);
    await ctx.materialService.softDelete(draft.id, professor);
    expect(await ctx.materials.findById(draft.id)).toBeNull();
    expect(await ctx.materials.findById(draft.id, { withDeleted: true })).toBeTruthy();

    await expect(ctx.materialService.restore(draft.id, professor)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    const restored = await ctx.materialService.restore(draft.id, admin);
    expect(restored.deletedAt).toBeNull();

    await expect(ctx.materialService.restore('missing', admin)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('reads visible materials and hides the rest', async () => {
    const hidden = makeMaterial({ ownerId: professor.id, visibility: Visibility.OCULTO });
    const publicMaterial = makeMaterial({ visibility: Visibility.PUBLICO });
    const deleted = makeMaterial({ visibility: Visibility.PUBLICO, deletedAt: now });
    ctx.materials.seed(hidden);
    ctx.materials.seed(publicMaterial);
    ctx.materials.seed(deleted);

    expect((await ctx.materialService.getForRead(publicMaterial.id, student)).id).toBe(
      publicMaterial.id,
    );
    expect((await ctx.materialService.getForRead(hidden.id, professor)).id).toBe(hidden.id);
    expect((await ctx.materialService.getForRead(hidden.id, admin)).id).toBe(hidden.id);
    await expect(ctx.materialService.getForRead(hidden.id, student)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(ctx.materialService.getForRead(deleted.id, admin)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(ctx.materialService.getForRead('missing', admin)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('reads stored files and reports missing files', async () => {
    const draft = await ctx.materialService.createDraft({ title: 'T' }, professor);
    await expect(ctx.materialService.getFile(draft.id, professor)).rejects.toBeInstanceOf(
      NotFoundError,
    );

    const attached = await ctx.materialService.attachFile(draft.id, pdf, professor);
    const file = await ctx.materialService.getFile(attached.id, professor);
    expect(file.fileName).toBe('apunte.pdf');
    expect(file.buffer.toString()).toBe('%PDF-1.4');
  });

  it('lists catalog and admin pages with clamped pagination', async () => {
    ctx.materials.seed(makeMaterial({ visibility: Visibility.PUBLICO, title: 'Público' }));
    ctx.materials.seed(makeMaterial({ visibility: Visibility.OCULTO, title: 'Oculto' }));
    ctx.materials.seed(makeMaterial({ visibility: Visibility.PUBLICO, deletedAt: now }));

    const catalog = await ctx.materialService.listCatalog({ page: 0, limit: 999 });
    expect(catalog.page).toBe(1);
    expect(catalog.limit).toBe(50);
    expect(catalog.items).toHaveLength(1);

    const adminPage = await ctx.materialService.listAdmin(true, 0, 999);
    expect(adminPage.page).toBe(1);
    expect(adminPage.limit).toBe(100);
    expect(adminPage.total).toBe(3);
  });

  it('lists own materials only for Professor and Admin', async () => {
    const draft = await ctx.materialService.createDraft({ title: 'Mío' }, professor);
    expect((await ctx.materialService.listMine(professor)).map((item) => item.id)).toContain(
      draft.id,
    );
    expect(await ctx.materialService.listMine(admin)).toEqual([]);
    await expect(ctx.materialService.listMine(student)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
