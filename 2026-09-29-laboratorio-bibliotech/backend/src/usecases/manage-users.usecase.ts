// FR-003 / UC-004 [Controller] — ManageUsersUseCase: solo operaciones de usuario.
// Split de ManageMaterialUseCase (B-3). Orden FS-primero (ADR-0005) pendiente.
import { Role, isRole } from '../entities/role';
import { DomainError } from './errors';
import type { UserRepository } from './ports';

export class ManageUsersUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly storage: { remove(key: string): Promise<void> },
  ) {}

  private assertAdmin(role: Role): void {
    if (role !== Role.Admin) throw new DomainError('FORBIDDEN', 'solo Admin');
  }

  async deleteUser(input: { callerRole: Role; userId: number }): Promise<void> {
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
    target.bumpVersion();
    return (await this.users.save(target)).toPublic();
  }
}
