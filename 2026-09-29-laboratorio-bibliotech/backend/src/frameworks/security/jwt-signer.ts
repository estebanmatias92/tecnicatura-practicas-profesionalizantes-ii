// FR-002 / UC-001 [Indirection] — JwtTokenSigner implementa TokenSigner tras
// @nestjs/jwt. Expiracion <= 24h (NFR-003); el secreto nunca sale al cliente
// (NFR-004). Inyectado por DI (Factory, ADR-0001).
import { JwtService } from '@nestjs/jwt';
import type { TokenSigner, TokenPayload } from '../../usecases/ports';

export class JwtTokenSigner implements TokenSigner {
  constructor(private readonly jwt: JwtService) {}

  sign(payload: TokenPayload): string {
    return this.jwt.sign({ sub: payload.userId, role: payload.role, ver: payload.ver });
  }

  verify(token: string): TokenPayload {
    const decoded = this.jwt.verify<{ sub: number; role: TokenPayload['role']; ver?: number }>(token);
    return { userId: decoded.sub, role: decoded.role, ver: decoded.ver ?? 0 };
  }
}
