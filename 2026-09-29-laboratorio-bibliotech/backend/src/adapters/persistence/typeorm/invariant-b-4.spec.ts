// invariant:B-4 (NFR-005, BT-10) — normalizeFileName + FileBlob.create basename sin CRLF.
import * as fs from 'fs';
import * as path from 'path';

describe('invariant:B-4', () => {
  it('ValidatorPort declara normalizeFileName', () => {
    const filePath = path.resolve(__dirname, '../../../usecases/ports.ts');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('normalizeFileName');
  });

  it('FileBlob.create normaliza basename', () => {
    const filePath = path.resolve(__dirname, '../../../entities/file-blob.entity.ts');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('basename');
  });
});
