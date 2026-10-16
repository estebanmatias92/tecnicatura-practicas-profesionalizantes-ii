// FR-001 / UC-001 [Controller] — RegisterUserUseCase.execute() es el unico
// punto de entrada del evento "registrar" (GoF Command, ADR-0002).
// Crea via User.create (Creator); valida via ValidatorPort (Pure Fabrication).
import { User } from '../entities/user.entity';
import { Role, isRole } from '../entities/role';
import { DomainError } from './errors';
import type { UserRepository, PasswordHasher, TokenSigner, ValidatorPort } from './ports';

export interface RegisterInput {
  email: string;
  password: string;
  requestedRole?: Role;
  requesterRole?: Role;
}

export interface AuthResult {
  token: string;
  userId: number;
  role: Role;
}

export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly signer: TokenSigner,
    private readonly validator: ValidatorPort,
  ) {}

  async execute(input: RegisterInput): Promise<AuthResult> {
    this.validator.validateEmail(input.email);
    this.validator.validatePassword(input.password);
    const email = input.email.trim().toLowerCase();
    if (await this.users.findByEmail(email)) {
      throw new DomainError('CONFLICT', 'email ya registrado');
    }
    const role =
      input.requesterRole === Role.Admin && input.requestedRole && isRole(input.requestedRole)
        ? input.requestedRole
        : Role.Student;
    const saved = await this.users.save(User.create({ email, passwordHash: await this.hasher.hash(input.password), role }));
    const token = this.signer.sign({ userId: saved.id as number, role: saved.role, ver: saved.tokenVersion });
    return { token, userId: saved.id as number, role: saved.role };
  }
}
