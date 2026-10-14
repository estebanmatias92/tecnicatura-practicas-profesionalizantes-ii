// FR-002 / UC-001 [Controller] — LoginUseCase.execute() unico punto de entrada.
// 401 generico en ambos fallos: no distingue usuario inexistente (UC-001 3a).
import { DomainError } from './errors';
import type { UserRepository, PasswordHasher, TokenSigner, ValidatorPort } from './ports';
import type { AuthResult } from './register-user.usecase';

export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly signer: TokenSigner,
    private readonly validator: ValidatorPort,
  ) {}

  async execute(input: { email: string; password: string }): Promise<AuthResult> {
    this.validator.validateEmail(input.email);
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    if (!user) throw new DomainError('UNAUTHORIZED', 'credencial incorrecta');
    if (!(await this.hasher.compare(input.password, user.passwordHash))) {
      throw new DomainError('UNAUTHORIZED', 'credencial incorrecta');
    }
    const token = this.signer.sign({ userId: user.id as number, role: user.role });
    return { token, userId: user.id as number, role: user.role };
  }
}
