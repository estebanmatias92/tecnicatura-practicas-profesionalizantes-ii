// FR-004/FR-013 / UC-002/UC-004 [Creator + Information Expert]
// Material conoce sus metadatos y su ownership. Reglas finas (rangos,
// longitudes) viven en Validator (UC-002: class-validator); la entidad
// guarda invariantes minimos no negociables. TDD Slice 2 (RED).
import { Material } from './material.entity';

describe('Material entity (FR-004 / UC-002)', () => {
  const base = { title: 'Redes', author: 'Tanenbaum', ownerId: 3, blobId: 9 };

  it('create asigna ownerId + blobId y recorta titulo/autor', () => {
    const m = Material.create({ ...base, title: '  Redes  ' });
    expect(m.title).toBe('Redes');
    expect(m.ownerId).toBe(3);
    expect(m.blobId).toBe(9);
  });

  it('create rechaza titulo/autor ausentes (invariante; UC-002 -> 400)', () => {
    expect(() => Material.create({ ...base, title: '  ' })).toThrow();
    expect(() => Material.create({ ...base, author: '' })).toThrow();
  });

  it('isOwnedBy decide ownership local (Information Expert; UC-004 C-1 -> 403)', () => {
    const m = Material.create(base);
    expect(m.isOwnedBy(3)).toBe(true);
    expect(m.isOwnedBy(4)).toBe(false);
  });

  it('toPublic expone metadatos sin bytes ni claves internas', () => {
    const m = Material.create({ ...base, subject: 'Redes', year: 2020, tags: ['ospf'] });
    const pub = m.toPublic() as Record<string, unknown>;
    expect(pub).toMatchObject({ title: 'Redes', author: 'Tanenbaum', subject: 'Redes', year: 2020 });
    expect(pub).not.toHaveProperty('bytes');
  });
});
