import { FileBlob } from '../../src/model/entities/file-blob.entity';
import { Material } from '../../src/model/entities/material.entity';
import { Role, Visibility } from '../../src/model/entities/enums';
import { User } from '../../src/model/entities/user.entity';
import { ValidationError } from '../../src/model/errors';
import { makeFile, makeMaterial, makeUser } from '../fakes';

describe('User entity', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');

  it('normalizes creation data and role helpers', () => {
    const user = User.create({
      email: '  Ana@Bibliotech.Local ',
      passwordHash: 'hash',
      role: Role.PROFESSOR,
      now,
    });

    expect(user.email).toBe('ana@bibliotech.local');
    expect(user.tokenVersion).toBe(0);
    expect(user.isProfessor()).toBe(true);
    expect(user.isAdmin()).toBe(false);
    expect(user.canManage(makeMaterial({ ownerId: user.id }))).toBe(true);
    expect(user.canManage(makeMaterial({ ownerId: 'other' }))).toBe(false);
  });

  it('promotes a user and invalidates previous tokens', () => {
    const user = makeUser(Role.STUDENT);
    const promoted = user.withRole(Role.ADMIN, new Date('2026-02-01T00:00:00.000Z'));

    expect(promoted.role).toBe(Role.ADMIN);
    expect(promoted.tokenVersion).toBe(1);
    expect(promoted.updatedAt).toEqual(new Date('2026-02-01T00:00:00.000Z'));
    expect(user.role).toBe(Role.STUDENT);
  });

  it('rehydrates and exposes props', () => {
    const user = makeUser(Role.ADMIN, { id: 'fixed' });
    expect(User.rehydrate(user.toProps()).toProps()).toEqual(user.toProps());
    expect(user.isAdmin()).toBe(true);
  });
});

describe('FileBlob entity', () => {
  it('creates and rehydrates file metadata', () => {
    const created = FileBlob.create({
      storageKey: 'key.pdf',
      originalName: 'apunte.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 10,
      now: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(created.id).toBeTruthy();
    expect(created.storageKey).toBe('key.pdf');
    expect(created.sizeBytes).toBe(10);
    expect(FileBlob.rehydrate(created.toProps()).toProps()).toEqual(created.toProps());
  });
});

describe('Material lifecycle', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');

  it('starts as a hidden draft and updates metadata', () => {
    const material = Material.createDraft({ ownerId: 'u1', title: '  Título  ', now });

    expect(material.title).toBe('Título');
    expect(material.visibility).toBe(Visibility.OCULTO);
    expect(material.publishedAt).toBeNull();
    expect(material.isDraft()).toBe(true);
    expect(material.isPublic()).toBe(false);
    expect(material.hasMetadata()).toBe(true);

    material.updateMetadata({ author: '  Autora  ', year: 2026 }, now);
    expect(material.author).toBe('Autora');
    expect(material.year).toBe(2026);
  });

  it('requires title, author and file to publish and keeps the first publication date', () => {
    const material = Material.createDraft({ ownerId: 'u1', title: 'T', now });
    expect(material.canBePublished()).toBe(false);
    expect(() => material.publish(now)).toThrow(ValidationError);

    material.updateMetadata({ author: 'A' }, now);
    expect(() => material.publish(now)).toThrow('archivo');

    material.attachFile(makeFile(), now);
    expect(material.canBePublished()).toBe(true);
    material.publish(new Date('2026-02-01T00:00:00.000Z'));

    expect(material.visibility).toBe(Visibility.PUBLICO);
    expect(material.publishedAt).toEqual(new Date('2026-02-01T00:00:00.000Z'));
    expect(material.isDraft()).toBe(false);

    material.publish(new Date('2026-03-01T00:00:00.000Z'));
    expect(material.publishedAt).toEqual(new Date('2026-02-01T00:00:00.000Z'));
  });

  it('hides without losing the publication date', () => {
    const material = makeMaterial({
      visibility: Visibility.PUBLICO,
      publishedAt: now,
      file: makeFile(),
    });
    material.hide(new Date('2026-02-01T00:00:00.000Z'));

    expect(material.visibility).toBe(Visibility.OCULTO);
    expect(material.publishedAt).toEqual(now);
    expect(material.isDraft()).toBe(false);
  });

  it('soft deletes idempotently and restores', () => {
    const material = makeMaterial();
    material.softDelete(now);
    material.softDelete(new Date('2026-02-01T00:00:00.000Z'));

    expect(material.deletedAt).toEqual(now);
    expect(() => material.publish(now)).toThrow(ValidationError);
    expect(() => material.hide(now)).toThrow(ValidationError);
    expect(() => material.attachFile(makeFile(), now)).toThrow(ValidationError);

    material.restore(new Date('2026-03-01T00:00:00.000Z'));
    expect(material.deletedAt).toBeNull();
  });

  it('evaluates visibility per user', () => {
    const owner = makeUser(Role.PROFESSOR, { id: 'u1' });
    const other = makeUser(Role.PROFESSOR, { id: 'u2' });
    const admin = makeUser(Role.ADMIN, { id: 'u3' });
    const hidden = makeMaterial({ visibility: Visibility.OCULTO, ownerId: owner.id });
    const publicMaterial = makeMaterial({ visibility: Visibility.PUBLICO });
    const deleted = makeMaterial({ visibility: Visibility.PUBLICO, deletedAt: new Date() });

    expect(hidden.isVisibleTo(owner)).toBe(true);
    expect(hidden.isVisibleTo(other)).toBe(false);
    expect(hidden.isVisibleTo(admin)).toBe(true);
    expect(publicMaterial.isVisibleTo(other)).toBe(true);
    expect(deleted.isVisibleTo(admin)).toBe(false);
  });

  it('prevents removing required fields from a published material', () => {
    const material = makeMaterial({
      visibility: Visibility.PUBLICO,
      publishedAt: now,
      file: makeFile(),
    });

    expect(() => material.updateMetadata({ title: null }, now)).toThrow(ValidationError);
    expect(() => material.updateMetadata({ author: null }, now)).toThrow(ValidationError);

    const withFile = makeMaterial({ file: makeFile() });
    withFile.updateMetadata(
      { title: null, author: null, description: null, subject: null, year: null },
      now,
    );
    expect(withFile.hasMetadata()).toBe(false);

    const withoutFile = makeMaterial();
    expect(() =>
      withoutFile.updateMetadata(
        { title: null, author: null, description: null, subject: null, year: null },
        now,
      ),
    ).toThrow('al menos un dato');
  });

  it('returns a defensive copy of props', () => {
    const material = makeMaterial();
    const props = material.toProps();
    expect(props).toEqual(material.toProps());
    expect(props).not.toBe(material.toProps());
  });
});
