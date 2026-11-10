import { Role } from '../../src/model/entities/enums';
import { ForbiddenError, ValidationError } from '../../src/model/errors';
import { EmailValidator } from '../../src/model/validators/email.validator';
import { FileValidator } from '../../src/model/validators/file.validator';
import { MaterialValidator } from '../../src/model/validators/material.validator';
import { PasswordValidator } from '../../src/model/validators/password.validator';
import { UserValidator } from '../../src/model/validators/user.validator';
import { makeFile, makeMaterial, makeUser } from '../fakes';

describe('EmailValidator', () => {
  it('normalizes and accepts valid emails', () => {
    expect(EmailValidator.normalize('  A@B.COM ')).toBe('a@b.com');
    expect(EmailValidator.assertValid('  A@B.COM ')).toBe('a@b.com');
  });

  it.each(['', 'sin-arroba', 'a@b', 'a@b.c'.repeat(60)])('rejects %s', (email) => {
    expect(() => EmailValidator.assertValid(email)).toThrow(ValidationError);
  });
});

describe('PasswordValidator', () => {
  it('accepts a valid password', () => {
    expect(() => PasswordValidator.assertValid('Secret1234!')).not.toThrow();
  });

  it.each(['short', ' '.repeat(8), 'x'.repeat(73)])('rejects %s', (password) => {
    expect(() => PasswordValidator.assertValid(password)).toThrow(ValidationError);
  });
});

describe('UserValidator', () => {
  it('validates roles and registration data', () => {
    expect(UserValidator.assertValidRole('ADMIN')).toBe(Role.ADMIN);
    expect(UserValidator.assertValidRegistration(' A@B.COM ', 'Secret1234!')).toEqual({
      email: 'a@b.com',
    });
    expect(UserValidator.assertValidCreation('a@b.com', 'Secret1234!', 'PROFESSOR')).toEqual({
      email: 'a@b.com',
      role: Role.PROFESSOR,
    });
  });

  it('rejects invalid roles', () => {
    expect(() => UserValidator.assertValidRole('ROOT')).toThrow(ValidationError);
  });
});

describe('FileValidator', () => {
  const maxBytes = 1024;

  it('accepts and sanitizes PDF and EPUB files', () => {
    const pdf = FileValidator.validate(
      {
        originalName: '../../mi apunte.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 8,
        buffer: Buffer.from('%PDF-1.4'),
      },
      maxBytes,
    );
    expect(pdf).toEqual({ originalName: 'mi apunte.pdf', mimeType: 'application/pdf' });

    const epub = FileValidator.validate(
      {
        originalName: 'libro.epub',
        mimeType: 'application/epub+zip',
        sizeBytes: 4,
        buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      },
      maxBytes,
    );
    expect(epub.originalName).toBe('libro.epub');
  });

  it('falls back to a safe base name', () => {
    expect(FileValidator.sanitizeOriginalName('...pdf', '.pdf')).toBe('material.pdf');
    expect(FileValidator.sanitizeOriginalName('a/b/c.pdf', '.pdf')).toBe('c.pdf');
  });

  it('rejects empty, oversized, mismatched and forged files', () => {
    const base = {
      originalName: 'apunte.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 8,
      buffer: Buffer.from('%PDF-1.4'),
    };

    expect(() => FileValidator.validate({ ...base, sizeBytes: 0, buffer: Buffer.alloc(0) }, maxBytes)).toThrow(
      'vacío',
    );
    expect(() => FileValidator.validate({ ...base, sizeBytes: 2048 }, maxBytes)).toThrow('máximo');
    expect(() => FileValidator.validate({ ...base, originalName: 'apunte.txt' }, maxBytes)).toThrow(
      'PDF o EPUB',
    );
    expect(() => FileValidator.validate({ ...base, mimeType: 'text/plain' }, maxBytes)).toThrow(
      'PDF o EPUB',
    );
    expect(() =>
      FileValidator.validate({ ...base, buffer: Buffer.from('NO-PDF') }, maxBytes),
    ).toThrow('no coincide');
  });
});

describe('MaterialValidator', () => {
  it('limits creation to Professor and Admin', () => {
    expect(() => MaterialValidator.assertCanCreateMaterial(makeUser(Role.STUDENT))).toThrow(
      ForbiddenError,
    );
    expect(() => MaterialValidator.assertCanCreateMaterial(makeUser(Role.PROFESSOR))).not.toThrow();
    expect(() => MaterialValidator.assertCanCreateMaterial(makeUser(Role.ADMIN))).not.toThrow();
  });

  it('requires at least one metadata field', () => {
    expect(() => MaterialValidator.assertAtLeastOneField({})).toThrow(ValidationError);
    expect(() => MaterialValidator.assertAtLeastOneField({ title: '  ' })).toThrow(ValidationError);
    expect(() => MaterialValidator.assertAtLeastOneField({ year: 2026 })).not.toThrow();
  });

  it('checks ownership and admin override', () => {
    const material = makeMaterial({ ownerId: 'u1' });
    expect(() => MaterialValidator.assertOwnerOrAdmin(material, makeUser(Role.PROFESSOR, { id: 'u1' }))).not.toThrow();
    expect(() => MaterialValidator.assertOwnerOrAdmin(material, makeUser(Role.PROFESSOR, { id: 'u2' }))).toThrow(
      ForbiddenError,
    );
    expect(() => MaterialValidator.assertOwnerOrAdmin(material, makeUser(Role.ADMIN, { id: 'u3' }))).not.toThrow();
  });

  it('reports missing publication fields', () => {
    const material = makeMaterial({ title: null, author: null, file: null });
    expect(() => MaterialValidator.assertCanPublish(material)).toThrow('título, autor, archivo');
  });

  it('allows publishing a complete material', () => {
    expect(() =>
      MaterialValidator.assertCanPublish(makeMaterial({ file: makeFile() })),
    ).not.toThrow();
  });
});
