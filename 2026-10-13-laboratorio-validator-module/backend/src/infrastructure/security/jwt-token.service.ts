import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedError } from '../../model/errors';
import type { TokenPayload, TokenService } from '../../model/repositories/token-service';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwt: JwtService) {}

  sign(payload: TokenPayload): string {
    return this.jwt.sign(payload);
  }

  verify(token: string): TokenPayload {
    try {
      const payload = this.jwt.verify<TokenPayload>(token);
      if (!payload?.sub || typeof payload.ver !== 'number') {
        throw new Error('payload incompleto');
      }
      return payload;
    } catch {
      throw new UnauthorizedError('Token inválido o expirado');
    }
  }
}
