import { ValidationError } from '../errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailValidator {
  static normalize(email: string): string {
    return email.trim().toLowerCase();
  }

  static assertValid(email: string): string {
    const normalized = EmailValidator.normalize(email ?? '');
    if (normalized.length === 0 || normalized.length > 255 || !EMAIL_PATTERN.test(normalized)) {
      throw new ValidationError('El email no tiene un formato válido');
    }
    return normalized;
  }
}
