import { User } from '../entities/user.entity';
import { Role } from '../entities/enums';
import { ConflictError, UnauthorizedError } from '../errors';
import type { UserRepository } from '../repositories/user.repository';
import type { PasswordHasher } from '../repositories/password-hasher';
import type { TokenPayload, TokenService } from '../repositories/token-service';
import type { Clock } from '../repositories/clock';
import { EmailValidator } from '../validators/email.validator';
import { UserValidator } from '../validators/user.validator';

export interface AuthResult {
  accessToken: string;
  user: User;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly clock: Clock,
  ) {}

  async register(email: string, password: string): Promise<AuthResult> {
    const { email: normalized } = UserValidator.assertValidRegistration(email, password);
    const existing = await this.users.findByEmail(normalized);
    if (existing) {
      throw new ConflictError('Ya existe una cuenta con ese email');
    }

    const user = User.create({
      email: normalized,
      passwordHash: await this.hasher.hash(password),
      role: Role.STUDENT,
      now: this.clock.now(),
    });
    const saved = await this.users.save(user);
    return { accessToken: this.issue(saved), user: saved };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normalized = EmailValidator.normalize(email ?? '');
    const user = await this.users.findByEmail(normalized);
    if (!user || !password) {
      throw new UnauthorizedError();
    }

    const valid = await this.hasher.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError();
    }

    return { accessToken: this.issue(user), user };
  }

  async authenticate(token: string): Promise<User> {
    return this.validateSession(this.tokens.verify(token));
  }

  async validateSession(payload: TokenPayload): Promise<User> {
    const user = await this.users.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.ver) {
      throw new UnauthorizedError('La sesión ya no es válida');
    }
    return user;
  }

  private issue(user: User): string {
    return this.tokens.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      ver: user.tokenVersion,
    });
  }
}
