import { FileBlob } from '../entities/file-blob.entity';
import { Material, type MaterialMetadataInput } from '../entities/material.entity';
import type { User } from '../entities/user.entity';
import { ForbiddenError, NotFoundError } from '../errors';
import type {
  MaterialFilter,
  MaterialPage,
  MaterialRepository,
} from '../repositories/material.repository';
import type { FileStorage } from '../repositories/file-storage';
import type { Clock } from '../repositories/clock';
import type { ModelConfig } from '../repositories/model-config';
import { MaterialValidator } from '../validators/material.validator';
import { FileValidator, type UploadedFileInput } from '../validators/file.validator';

export interface MaterialFile {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export class MaterialService {
  constructor(
    private readonly materials: MaterialRepository,
    private readonly storage: FileStorage,
    private readonly clock: Clock,
    private readonly config: ModelConfig,
  ) {}

  async createDraft(input: MaterialMetadataInput, user: User): Promise<Material> {
    MaterialValidator.assertCanCreateMaterial(user);
    MaterialValidator.assertAtLeastOneField(input);
    const material = Material.createDraft({
      ownerId: user.id,
      ...input,
      now: this.clock.now(),
    });
    return this.materials.save(material);
  }

  async update(id: string, input: MaterialMetadataInput, user: User): Promise<Material> {
    const material = await this.findActive(id);
    MaterialValidator.assertOwnerOrAdmin(material, user);
    material.updateMetadata(input, this.clock.now());
    return this.materials.save(material);
  }

  async attachFile(id: string, upload: UploadedFileInput, user: User): Promise<Material> {
    const material = await this.findActive(id);
    MaterialValidator.assertOwnerOrAdmin(material, user);

    const validated = FileValidator.validate(upload, this.config.maxFileSizeBytes);
    const stored = await this.storage.save(upload.buffer, validated.originalName, validated.mimeType);
    const blob = FileBlob.create({
      storageKey: stored.storageKey,
      originalName: validated.originalName,
      mimeType: validated.mimeType,
      sizeBytes: stored.sizeBytes,
      now: this.clock.now(),
    });
    const previous = material.attachFile(blob, this.clock.now());

    try {
      const saved = await this.materials.save(material);
      if (previous) {
        await this.purge(previous);
      }
      return saved;
    } catch (error) {
      await this.storage.delete(stored.storageKey).catch(() => undefined);
      throw error;
    }
  }

  async publish(id: string, user: User): Promise<Material> {
    const material = await this.findActive(id);
    MaterialValidator.assertOwnerOrAdmin(material, user);
    MaterialValidator.assertCanPublish(material);
    material.publish(this.clock.now());
    return this.materials.save(material);
  }

  async hide(id: string, user: User): Promise<Material> {
    const material = await this.findActive(id);
    MaterialValidator.assertOwnerOrAdmin(material, user);
    material.hide(this.clock.now());
    return this.materials.save(material);
  }

  async softDelete(id: string, user: User): Promise<void> {
    const material = await this.findActive(id);
    MaterialValidator.assertOwnerOrAdmin(material, user);
    material.softDelete(this.clock.now());
    await this.materials.save(material);
  }

  async restore(id: string, user: User): Promise<Material> {
    if (!user.isAdmin()) {
      throw new ForbiddenError('Solo Admin puede restaurar materiales');
    }
    const material = await this.materials.findById(id, { withDeleted: true });
    if (!material) {
      throw new NotFoundError('Material no encontrado');
    }
    material.restore(this.clock.now());
    return this.materials.save(material);
  }

  async getForRead(id: string, user: User): Promise<Material> {
    const material = await this.materials.findById(id);
    if (!material || !material.isVisibleTo(user)) {
      throw new NotFoundError('Material no encontrado');
    }
    return material;
  }

  async getFile(id: string, user: User): Promise<MaterialFile> {
    const material = await this.getForRead(id, user);
    if (!material.file) {
      throw new NotFoundError('El material no tiene archivo');
    }
    return {
      fileName: material.file.originalName,
      mimeType: material.file.mimeType,
      buffer: await this.storage.read(material.file.storageKey),
    };
  }

  listCatalog(filter: MaterialFilter): Promise<MaterialPage> {
    return this.materials.listCatalog({
      ...filter,
      page: Math.max(1, filter.page || 1),
      limit: Math.min(50, Math.max(1, filter.limit || 10)),
    });
  }

  async listMine(user: User): Promise<Material[]> {
    if (!user.isProfessor() && !user.isAdmin()) {
      throw new ForbiddenError('Solo Professor o Admin tienen materiales propios');
    }
    return this.materials.listByOwner(user.id);
  }

  async listAdmin(includeDeleted: boolean, page: number, limit: number): Promise<MaterialPage> {
    return this.materials.listAll({
      includeDeleted,
      page: Math.max(1, page || 1),
      limit: Math.min(100, Math.max(1, limit || 20)),
    });
  }

  private async findActive(id: string): Promise<Material> {
    const material = await this.materials.findById(id);
    if (!material) {
      throw new NotFoundError('Material no encontrado');
    }
    return material;
  }

  private async purge(blob: FileBlob): Promise<void> {
    try {
      await this.storage.delete(blob.storageKey);
      await this.materials.deleteFileBlob(blob.id);
    } catch {
      // La limpieza del archivo reemplazado es best-effort.
    }
  }
}
