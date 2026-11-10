export abstract class DomainError extends Error {
  abstract readonly status: number;
  abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  readonly status = 400;
  readonly code = 'VALIDATION';

  constructor(message: string) {
    super(message);
  }
}

export class UnauthorizedError extends DomainError {
  readonly status = 401;
  readonly code = 'UNAUTHORIZED';

  constructor(message = 'Credenciales inválidas') {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  readonly status = 403;
  readonly code = 'FORBIDDEN';

  constructor(message = 'No tenés permiso para realizar esta acción') {
    super(message);
  }
}

export class NotFoundError extends DomainError {
  readonly status = 404;
  readonly code = 'NOT_FOUND';

  constructor(message = 'Recurso no encontrado') {
    super(message);
  }
}

export class ConflictError extends DomainError {
  readonly status = 409;
  readonly code = 'CONFLICT';

  constructor(message: string) {
    super(message);
  }
}
