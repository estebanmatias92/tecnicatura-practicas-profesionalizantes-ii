// FR-004/FR-008 / UC-002/UC-006 [Information Expert] — FileBlob conoce
// storageKey/mime/size; contentHash informativo no gobierna nada (BR-004 v0.4.0).
// TDD Slice 2 (RED).
import { FileBlob } from './file-blob.entity';

describe('FileBlob entity (FR-004 / UC-002)', () => {
  it('create guarda storageKey + fileName + mime + size', () => {
    const b = FileBlob.create({ storageKey: 'abc.pdf', fileName: 'redes.pdf', mime: 'application/pdf', sizeBytes: 100 });
    expect(b.storageKey).toBe('abc.pdf');
    expect(b.fileName).toBe('redes.pdf');
    expect(b.sizeBytes).toBe(100);
  });

  it('create rechaza storageKey vacio, fileName vacio y size <= 0', () => {
    const ok = { storageKey: 'x', fileName: 'f.pdf', mime: 'application/pdf', sizeBytes: 10 };
    expect(() => FileBlob.create({ ...ok, storageKey: '' })).toThrow();
    expect(() => FileBlob.create({ ...ok, fileName: '  ' })).toThrow();
    expect(() => FileBlob.create({ ...ok, sizeBytes: 0 })).toThrow();
  });

  it('contentHash duplicado no impide crear (duplicados -> 201, BR-004)', () => {
    const mk = (key: string) =>
      FileBlob.create({ storageKey: key, fileName: `${key}.pdf`, mime: 'application/pdf', sizeBytes: 10, contentHash: 'same' });
    expect(mk('a.pdf').storageKey).toBe('a.pdf');
    expect(mk('b.pdf').storageKey).toBe('b.pdf');
  });
});
