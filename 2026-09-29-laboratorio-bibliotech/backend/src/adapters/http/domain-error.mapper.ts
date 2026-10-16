// Adapters HTTP [Indirection] — DomainError (usecases) -> HttpException.
// Unico lugar donde el dominio toca HTTP; controllers solo delegan.
import { HttpException } from '@nestjs/common';
import { DomainError } from '../../usecases/errors';

const STATUS: Record<DomainError['code'], number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA: 415,
  INTERNAL: 500,
  SERVICE_UNAVAILABLE: 503,
};

export function toHttp(e: unknown): never {
  if (e instanceof DomainError) throw new HttpException({ message: e.message, code: e.code }, STATUS[e.code]);
  throw e;
}
