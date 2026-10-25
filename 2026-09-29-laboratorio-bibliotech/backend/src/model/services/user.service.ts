import { User } from '../entities/user.entity';
import { ConflictError, NotFoundError, ValidationError } from '../errors';
import type { UserRepository } from '../repositories/user.repository';
import type { PasswordHasher } from '../repositories/password-hasher';
import type { Clock } from '../repositories/clock';
import { UserValidator } from '../validators/user.validator';

export class UserService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly clock: Clock,
  ) {}

  list(): Promise<User[]> {
    return this.users.list();
  }

  async create(input: { email: string; password: string; role: string }): Promise<User> {
    const { email, role } = UserValidator.assertValidCreation(input.email, input.password, input.role);
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictError('Ya existe una cuenta con ese email');
    }

    const user = User.create({
      email,
      passwordHash: await this.hasher.hash(input.password),
      role,
      now: this.clock.now(),
    });
    return this.users.save(user);
  }

  async updateRole(id: string, role: string, actor: User): Promise<User> {
    const normalizedRole = UserValidator.assertValidRole(role);
    if (actor.id === id) {
      throw new ValidationError('No podés cambiar tu propio rol');
    }

    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return this.users.save(user.withRole(normalizedRole, this.clock.now()));
  }
}
