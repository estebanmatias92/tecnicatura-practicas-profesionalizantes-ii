// FR-011/FR-012/FR-013 / UC-004 [Controller] — un metodo por flujo C-1/C-2/C-3
// + edicion propia + admin de usuarios (High Cohesion, no God-controller).
// Ownership via Material.isOwnedBy (Information Expert).
import { Role, isRole } from '../entities/role';
import { DomainError } from './errors';
import type {
  UserRepository,
  MaterialRepository,
  ValidatorPort,
  MaterialPatch,
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

  /** C-1 (propio) / C-3 (Admin cualquiera): borra material + su blob. */
  async deleteMaterial(input: { callerId: number; callerRole: Role; materialId: number }): Promise<void> {
    const found = await this.materials.findById(input.materialId);
    if (!found) throw new DomainError('NOT_FOUND', 'material inexistente');
    if (input.callerRole !== Role.Admin && !found.isOwnedBy(input.callerId)) {
      throw new DomainError('FORBIDDEN', 'solo el dueno o Admin');
    }
    const { storageKey } = await this.materials.deleteWithBlob(input.materialId);
    await this.storage.remove(storageKey);
  }

  /** FR-013: Professor edita el propio; Admin cualquiera. */
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

  /** C-2: Admin borra cuenta + materials + blobs; limpia FS (E-001: el repo
   *  revierte la transaccion si la DB falla; aqui se revierte el FS). */
  async deleteUser(input: { callerId: number; callerRole: Role; userId: number }): Promise<void> {
    this.assertAdmin(input.callerRole);
    const target = await this.users.findById(input.userId);
    if (!target) throw new DomainError('NOT_FOUND', 'usuario inexistente');
    const keys = await this.users.deleteCascade(input.userId);
    await Promise.all(keys.map((k) => this.storage.remove(k)));
  }

  async listUsers(callerRole: Role): Promise<Record<string, unknown>[]> {
    this.assertAdmin(callerRole);
    const all = await this.users.findAll();
    return all.map((u) => u.toPublic());
  }

  async changeUserRole(input: { callerRole: Role; userId: number; role: Role }): Promise<Record<string, unknown>> {
    this.assertAdmin(input.callerRole);
    if (!isRole(input.role)) throw new DomainError('BAD_REQUEST', 'rol invalido');
    const target = await this.users.findById(input.userId);
    if (!target) throw new DomainError('NOT_FOUND', 'usuario inexistente');
    target.role = input.role;
    return (await this.users.save(target)).toPublic();
  }
}
