import { ValidationError } from '../errors';
import { Role } from '../entities/enums';
import { EmailValidator } from './email.validator';
import { PasswordValidator } from './password.validator';

export class UserValidator {
  static assertValidRole(role: string): Role {
    if (!Object.values(Role).includes(role as Role)) {
      throw new ValidationError('El rol debe ser ADMIN, PROFESSOR o STUDENT');
    }
    return role as Role;
  }

  static assertValidRegistration(email: string, password: string): { email: string } {
    const normalized = EmailValidator.assertValid(email);
    PasswordValidator.assertValid(password);
    return { email: normalized };
  }

  static assertValidCreation(email: string, password: string, role: string): { email: string; role: Role } {
    const normalized = EmailValidator.assertValid(email);
    PasswordValidator.assertValid(password);
    return { email: normalized, role: UserValidator.assertValidRole(role) };
  }
}
