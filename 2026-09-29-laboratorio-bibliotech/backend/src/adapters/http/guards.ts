// FR-003/NFR-006 [Indirection] — guards como adapters: verifican JWT y rol
// antes de llegar al usecase (BR-002: 401 primero). Controllers HTTP solo
// delegan (Controller = UseCase, ADR-0001).
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TokenSigner } from '../../usecases/ports';
import { Role } from '../../entities/role';
import { TypeOrmUserRepository } from '../persistence/typeorm/typeorm-repositories';

export const ROLES_KEY = 'bibliotech_roles';
export const RequireRoles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const IS_PUBLIC_KEY = 'bibliotech_public';
/** Rutas sin JWT: solo /auth/register y /auth/login (UC-001). Todo lo demas exige Bearer (BR-002). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: { userId: number; role: Role };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly signer: TokenSigner,
    private readonly reflector: Reflector,
    private readonly users: TypeOrmUserRepository,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers['authorization'];
    const token = Array.isArray(header) ? header[0] : header?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('falta Authorization Bearer (BR-002)');
    try {
      const payload = this.signer.verify(token);
      const user = await this.users.findById(payload.userId);
      if (!user) throw new UnauthorizedException('usuario no encontrado');
      if (user.tokenVersion !== payload.ver) throw new UnauthorizedException('token revocado (token_version desactualizado)');
      req.user = { userId: payload.userId, role: payload.role };
      return true;
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('JWT invalido o expirado');
    }
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!required || required.length === 0) return true;
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!req.user || !required.includes(req.user.role)) {
      throw new ForbiddenException('rol insuficiente (FR-003)');
    }
    return true;
  }
}
