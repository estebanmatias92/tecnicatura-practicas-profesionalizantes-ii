// invariant:B-1 (ADR-0005, BT-05) — FK materials.blob_id NO ACTION (no CASCADE).
// Guarda: la DB no debe eliminar blob automáticamente; la app usa transacción.
import * as fs from 'fs';
import * as path from 'path';

describe('invariant:B-1', () => {
  it('orm-entities.ts declara onDelete: NO ACTION para material.blob', () => {
    const filePath = path.resolve(__dirname, 'orm-entities.ts');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain("onDelete: 'NO ACTION'");
  });

  it('No existe CASCADE en la relación material->blob', () => {
    const filePath = path.resolve(__dirname, 'orm-entities.ts');
    const content = fs.readFileSync(filePath, 'utf8');
    const blobRelation = content.substring(
      content.indexOf('@ManyToOne(() => FileBlobOrm'),
      content.indexOf('blob!: FileBlobOrm;') + 'blob!: FileBlobOrm;'.length
    );
    expect(blobRelation).toContain("onDelete: 'NO ACTION'");
    expect(blobRelation).not.toContain("onDelete: 'CASCADE'");
  });
});
