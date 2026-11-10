import { ValidationError } from '../errors';
import { resolveMessage } from '../messages';

export class PasswordValidator {
  static assertValid(password: string): void {
    if (typeof password !== 'string' || password.length < 1 || password.trim().length === 0) {
      throw new ValidationError(resolveMessage('validation.password.empty'));
    }
    if (password.length < 8) {
      throw new ValidationError(
        resolveMessage('validation.password.too-short', { min: 8 }),
      );
    }
    if (password.length > 72) {
      throw new ValidationError(
        resolveMessage('validation.password.too-long', { max: 72 }),
      );
    }
  }
}
