import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MulterError } from 'multer';
import { Role } from '../../src/model/entities/enums';
import type { User } from '../../src/model/entities/user.entity';
import { ValidationError } from '../../src/model/errors';
import type { AuthService } from '../../src/model/services/auth.service';
import { DomainExceptionFilter } from '../../src/controller/filters/domain-exception.filter';
import { MulterExceptionFilter } from '../../src/controller/filters/multer-exception.filter';
import { JwtAuthGuard } from '../../src/controller/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/controller/guards/roles.guard';
import { makeUser } from '../fakes';

function context(request: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class TestController {},
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const user = makeUser(Role.PROFESSOR);
  let reflector: { getAllAndOverride: jest.Mock };
  let auth: { authenticate: jest.Mock };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    auth = { authenticate: jest.fn() };
    guard = new JwtAuthGuard(reflector as unknown as Reflector, auth as unknown as AuthService);
  });

  it('lets public routes through', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(context({ headers: {} }))).resolves.toBe(true);
    expect(auth.authenticate).not.toHaveBeenCalled();
  });

  it('requires a bearer token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    await expect(guard.canActivate(context({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      guard.canActivate(context({ headers: { authorization: 'Basic abc' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the authenticated user', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    auth.authenticate.mockResolvedValue(user);
    const request: { headers: Record<string, string>; user?: User } = {
      headers: { authorization: 'Bearer token' },
    };

    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(auth.authenticate).toHaveBeenCalledWith('token');
    expect(request.user).toBe(user);
  });

  it('rejects invalid sessions', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    auth.authenticate.mockRejectedValue(new Error('expirado'));
    await expect(
      guard.canActivate(context({ headers: { authorization: 'Bearer token' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows routes without role metadata', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(context({}))).toBe(true);
  });

  it('requires an authenticated user', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    expect(() => guard.canActivate(context({}))).toThrow(UnauthorizedException);
  });

  it('checks the user role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    expect(() => guard.canActivate(context({ user: makeUser(Role.STUDENT) }))).toThrow(
      ForbiddenException,
    );
    expect(guard.canActivate(context({ user: makeUser(Role.ADMIN) }))).toBe(true);
  });
});

describe('exception filters', () => {
  function host(response: Record<string, jest.Mock>): ExecutionContext {
    return {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ExecutionContext;
  }

  it('maps domain errors to HTTP responses', () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    new DomainExceptionFilter().catch(new ValidationError('dato inválido'), host(response));

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'dato inválido',
      error: 'VALIDATION',
    });
  });

  it('maps multer size errors to 413 and others to 400', () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const filter = new MulterExceptionFilter();

    filter.catch(new MulterError('LIMIT_FILE_SIZE'), host(response));
    expect(response.status).toHaveBeenLastCalledWith(413);

    filter.catch(new MulterError('LIMIT_UNEXPECTED_FILE'), host(response));
    expect(response.status).toHaveBeenLastCalledWith(400);
  });
});
