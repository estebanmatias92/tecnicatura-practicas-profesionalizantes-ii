// invariant:B-6 (BUG-002) — DownloadFileUseCase lanza SERVICE_UNAVAILABLE si storage cae.
import * as fs from 'fs';
import * as path from 'path';

describe('invariant:B-6', () => {
  it('DomainErrorCode incluye SERVICE_UNAVAILABLE', () => {
    const filePath = path.resolve(__dirname, '../../../usecases/errors.ts');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('SERVICE_UNAVAILABLE');
  });

  it('download-file.usecase lanza SERVICE_UNAVAILABLE', () => {
    const filePath = path.resolve(__dirname, '../../../usecases/download-file.usecase.ts');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('SERVICE_UNAVAILABLE');
  });
});
