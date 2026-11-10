import { ForbiddenError, ValidationError } from '../errors';
import type { Material, MaterialMetadataInput } from '../entities/material.entity';
import type { User } from '../entities/user.entity';

export class MaterialValidator {
  static assertCanCreateMaterial(user: User): void {
    if (!user.isProfessor() && !user.isAdmin()) {
      throw new ForbiddenError('Solo Professor o Admin pueden crear material');
    }
  }

  static assertAtLeastOneField(input: MaterialMetadataInput): void {
    const hasValue =
      (typeof input.title === 'string' && input.title.trim().length > 0) ||
      (typeof input.author === 'string' && input.author.trim().length > 0) ||
      (typeof input.description === 'string' && input.description.trim().length > 0) ||
      (typeof input.subject === 'string' && input.subject.trim().length > 0) ||
      (typeof input.year === 'number' && Number.isFinite(input.year));

    if (!hasValue) {
      throw new ValidationError('Ingresá al menos un dato para crear el borrador');
    }
  }

  static assertOwnerOrAdmin(material: Material, user: User): void {
    if (!user.isAdmin() && material.ownerId !== user.id) {
      throw new ForbiddenError('Solo el propietario o Admin pueden modificar este material');
    }
  }

  static assertCanPublish(material: Material): void {
    if (!material.canBePublished()) {
      const missing: string[] = [];
      if (!material.title) missing.push('título');
      if (!material.author) missing.push('autor');
      if (!material.file) missing.push('archivo');
      throw new ValidationError(`Para publicar faltan: ${missing.join(', ')}`);
    }
  }
}
