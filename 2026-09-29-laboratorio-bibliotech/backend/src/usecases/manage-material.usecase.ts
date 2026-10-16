// FR-011/FR-012/FR-013 / UC-004 [Controller] — ManageMaterialUseCase sin operaciones de usuario (B-3 split).
import { Role } from '../entities/role';
import { DomainError } from './errors';
import type {
  UserRepository,
  MaterialRepository,
  MaterialPatch,
  ValidatorPort,
} from './ports';

export class ManageMaterialUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly materials: MaterialRepository,
    private readonly storage: { remove(key: string): Promise<void> },
    private readonly validator: ValidatorPort,
  ) {}

  private assertAdmin(callerRole: Role): void {
    if (callerRole !== Role.Admin) throw new DomainError('FORBIDDEN', 'solo Admin');
  }

  async deleteMaterial(input: { callerId: number; callerRole: Role; materialId: number }): Promise<void> {
    const found = await this.materials.findById(input.materialId);
    if (!found) throw new DomainError('NOT_FOUND', 'material inexistente');
    if (input.callerRole !== Role.Admin && !found.isOwnedBy(input.callerId)) {
      throw new DomainError('FORBIDDEN', 'solo el dueno o Admin');
    }
    const { storageKey } = await this.materials.deleteWithBlob(input.materialId);
    await this.storage.remove(storageKey);
  }

  async updateMaterial(input: {
    callerId: number;
    callerRole: Role;
    materialId: number;
    patch: MaterialPatch;
  }): Promise<Record<string, unknown>> {
    const found = await this.materials.findById(input.materialId);
    if (!found) throw new DomainError('NOT_FOUND', 'material inexistente');
    if (input.callerRole !== Role.Admin && !found.isOwnedBy(input.callerId)) {
      throw new DomainError('FORBIDDEN', 'solo el dueno o Admin');
    }
    this.validator.validateMetadata(input.patch);
    found.applyPatch(input.patch);
    return (await this.materials.save(found)).toPublic();
  }
}
