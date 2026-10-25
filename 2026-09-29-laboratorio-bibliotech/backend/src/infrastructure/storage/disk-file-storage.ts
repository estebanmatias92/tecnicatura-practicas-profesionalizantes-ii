import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { basename, extname, join, resolve } from 'path';
import type { FileStorage, StoredFile } from '../../model/repositories/file-storage';

@Injectable()
export class DiskFileStorage implements FileStorage, OnModuleInit {
  private readonly directory: string;

  constructor(config: ConfigService) {
    this.directory = resolve(config.get<string>('UPLOAD_DIR') ?? './uploads');
  }

  async onModuleInit(): Promise<void> {
    await mkdir(this.directory, { recursive: true });
  }

  async save(buffer: Buffer, originalName: string, _mimeType: string): Promise<StoredFile> {
    const extension = extname(originalName).toLowerCase();
    const storageKey = `${randomUUID()}${extension}`;
    await writeFile(join(this.directory, storageKey), buffer);
    return { storageKey, sizeBytes: buffer.length };
  }

  async read(storageKey: string): Promise<Buffer> {
    if (basename(storageKey) !== storageKey) {
      throw new Error('storageKey inválida');
    }
    return readFile(join(this.directory, storageKey));
  }

  async delete(storageKey: string): Promise<void> {
    if (basename(storageKey) !== storageKey) return;
    try {
      await unlink(join(this.directory, storageKey));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
