// NFR-002/NFR-005 / UC-002/UC-006 [Indirection] — DiskFileStorage implementa
// FileStorage sobre FS local (Adapter Multer-compatible, ADR-0003).
// Streaming sin buffer (UC-006 Won't-cap); remove ignora ENOENT para que el
// reintento de DELETE sea idempotente (C-1/C-2/C-3).
import { createReadStream, promises as fs } from 'node:fs';
import { join, extname } from 'node:path';
import { randomBytes } from 'node:crypto';
import type { FileStorage } from '../../usecases/ports';

export class DiskFileStorage implements FileStorage {
  constructor(private readonly uploadDir: string) {}

  async store(buffer: Buffer, originalName: string): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    const key = `${Date.now()}-${randomBytes(8).toString('hex')}${extname(originalName)}`;
    await fs.writeFile(join(this.uploadDir, key), buffer);
    return key;
  }

  stream(storageKey: string): unknown {
    return createReadStream(join(this.uploadDir, storageKey));
  }

  async remove(storageKey: string): Promise<void> {
    try {
      await fs.unlink(join(this.uploadDir, storageKey));
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    }
  }
}
