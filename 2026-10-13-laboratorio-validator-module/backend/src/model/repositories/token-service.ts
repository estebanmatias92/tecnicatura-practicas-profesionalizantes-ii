import type { Role } from '../entities/enums';

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
  ver: number;
}

export interface TokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
