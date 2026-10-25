import { ValidationError } from '../errors';

export class PasswordValidator {
  static assertValid(password: string): void {
    if (typeof password !== 'string' || password.length < 8) {
      throw new ValidationError('La contraseña debe tener al menos 8 caracteres');
    }
    if (password.length > 72) {
      throw new ValidationError('La contraseña no puede superar los 72 caracteres');
    }
    if (password.trim().length === 0) {
      throw new ValidationError('La contraseña no puede ser vacía');
    }
  }
}
