// UC-001 + matriz NFR-006 (nivel guards/controllers) [e2e adapter].
// Mapea 1:1 a backend/tests/cases/UC-001.feature y NFR-003-004-006.feature.
// Guards Nest directos (sin TestModule): JwtAuthGuard = 401 primero (BR-002),
// RolesGuard = 403 por rol (FR-003). Usuarios via usecases reales + fakes con estado.
import { HttpException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { JwtAuthGuard, RolesGuard } from '../../src/adapters/http/guards';
import { AuthController } from '../../src/adapters/http/auth.controller';
import { UsersController } from '../../src/adapters/http/users.controller';
import { toHttp } from '../../src/adapters/http/domain-error.mapper';
import { DomainError } from '../../src/usecases/errors';
import { RegisterUserUseCase } from '../../src/usecases/register-user.usecase';
import { LoginUseCase } from '../../src/usecases/login.usecase';
import { ManageMaterialUseCase } from '../../src/usecases/manage-material.usecase';
import { Role } from '../../src/entities/role';
import { User } from '../../src/entities/user.entity';
import { createWorld } from '../helpers/fakes';

function reflectorReturning(value: unknown): Reflector {
  return { getAllAndOverride: () => value } as unknown as Reflector;
}

function httpCtx(headers: Record<string, string>): ExecutionContext {
  const req = { headers };
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function httpStatusOf(fn: () => void): number {
  try {
    fn();
  } catch (e) {
    return (e as HttpException).getStatus();
  }
  throw new Error('httpStatusOf: no lanzo HttpException');
}

function setupAuth() {
  const w = createWorld();
  const register = new RegisterUserUseCase(w.users, w.hasher, w.signer, w.validator);
  const login = new LoginUseCase(w.users, w.hasher, w.signer, w.validator);
  const manage = new ManageMaterialUseCase(w.users, w.materials, w.storage, w.validator);
  return { w, register, login, manage };
}

describe('UC-001 registro/login (FR-001/FR-002 + BR-003)', () => {
  it('registro Student valido queda logueado sin exponer password', async () => {
    const { register } = setupAuth();
    const out = await register.execute({ email: 'alu01@biblio.tech', password: 'Segura123' });
    expect(out.role).toBe(Role.Student);
    expect(out.token).toMatch(/^jwt\.\d+\.Student$/);
    expect(out).not.toHaveProperty('password');
    expect(out).not.toHaveProperty('passwordHash');
  });

  it('registro con email duplicado (case-insensitive)', async () => {
    const { register } = setupAuth();
    await register.execute({ email: 'Alu01@biblio.tech', password: 'Segura123' });
    await expect(register.execute({ email: 'alu01@biblio.tech', password: 'Segura123' })).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    expect(httpStatusOf(() => toHttp(new DomainError('CONFLICT', 'email ya registrado')))).toBe(409);
  });

  it.each(['mal', 'sin-arroba.com', '@sin-local.com', 'a@b'])(
    'registro con email invalido %p (particion + borde)',
    async (email) => {
      const { w, register } = setupAuth();
      await expect(register.execute({ email, password: 'Segura123' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
      expect(await w.users.findAll()).toHaveLength(0);
    },
  );

  it('registro con password de 7 caracteres (borde 7/8)', async () => {
    const { w, register } = setupAuth();
    await expect(register.execute({ email: 'borde@biblio.tech', password: '1234567' })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
    expect(await w.users.findAll()).toHaveLength(0);
    const out = await register.execute({ email: 'borde@biblio.tech', password: '12345678' });
    expect(out.role).toBe(Role.Student);
  });

  it('registro con cuerpo nulo (null)', async () => {
    const { w, register } = setupAuth();
    await expect(
      register.execute({ email: undefined as unknown as string, password: undefined as unknown as string }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(await w.users.findAll()).toHaveLength(0);
  });

  it('registro publico que pide role Admin queda Student', async () => {
    const { w, register } = setupAuth();
    const out = await register.execute({ email: 'vivo@biblio.tech', password: 'Segura123', requestedRole: Role.Admin });
    expect(out.role).toBe(Role.Student);
    expect((await w.users.findByEmail('vivo@biblio.tech'))?.role).toBe(Role.Student);
  });

  it('Admin crea usuario con rol via API', async () => {
    const { register } = setupAuth();
    const out = await register.execute({
      email: 'p@biblio.tech',
      password: 'Segura123',
      requestedRole: Role.Professor,
      requesterRole: Role.Admin,
    });
    expect(out.role).toBe(Role.Professor);
  });

  it('crear usuario sin requestedRole es 400 (UsersController)', async () => {
    const { register, manage } = setupAuth();
    const controller = new UsersController(register, manage);
    const req = { headers: { authorization: 'Bearer jwt.1.Admin' } };
    await expect(
      controller.create(req as never, { email: 'x@biblio.tech', password: 'Segura123' } as never),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('login valido emite JWT sin password', async () => {
    const { register, login } = setupAuth();
    await register.execute({ email: 'alu01@biblio.tech', password: 'Segura123' });
    const out = await login.execute({ email: 'alu01@biblio.tech', password: 'Segura123' });
    expect(out.token).toMatch(/^jwt\.\d+\.Student$/);
    expect(out).not.toHaveProperty('password');
  });

  it('login con password incorrecta no distingue causa', async () => {
    const { register, login } = setupAuth();
    await register.execute({ email: 'alu01@biblio.tech', password: 'Segura123' });
    const err = await login.execute({ email: 'alu01@biblio.tech', password: 'Otra9999' }).catch((e) => e);
    expect(err).toBeInstanceOf(DomainError);
    expect((err as DomainError).code).toBe('UNAUTHORIZED');
    expect((err as Error).message).not.toMatch(/existe|registrado|usuario/i);
  });

  it('login con email inexistente responde igual que password mala', async () => {
    const { register, login } = setupAuth();
    await register.execute({ email: 'alu01@biblio.tech', password: 'Segura123' });
    const badPwd = await login.execute({ email: 'alu01@biblio.tech', password: 'Otra9999' }).catch((e: Error) => e.message);
    const noUser = await login.execute({ email: 'nadie@biblio.tech', password: 'Segura123' }).catch((e: Error) => e.message);
    expect(noUser).toBe(badPwd);
  });
});

describe('guards + mapper (FR-003 + BR-002 + NFR-006)', () => {
  it('acceso sin token a ruta protegida', () => {
    const { signer } = createWorld();
    const guard = new JwtAuthGuard(signer, reflectorReturning(false));
    expect(httpStatusOf(() => void guard.canActivate(httpCtx({})))).toBe(401);
  });

  it('acceso con JWT expirado o manipulado', () => {
    const { signer } = createWorld();
    const guard = new JwtAuthGuard(signer, reflectorReturning(false));
    expect(httpStatusOf(() => void guard.canActivate(httpCtx({ authorization: 'Bearer roto' })))).toBe(401);
  });

  it('ruta publica pasa sin token (solo /auth/*)', () => {
    const { signer } = createWorld();
    const guard = new JwtAuthGuard(signer, reflectorReturning(true));
    expect(guard.canActivate(httpCtx({}))).toBe(true);
  });

  it('JWT valido fija user para el resto de la cadena', () => {
    const { signer } = createWorld();
    const guard = new JwtAuthGuard(signer, reflectorReturning(false));
    const ctx = httpCtx({ authorization: 'Bearer jwt.7.Student' });
    expect(guard.canActivate(ctx)).toBe(true);
    const req = ctx.switchToHttp().getRequest() as { user?: unknown };
    expect(req.user).toEqual({ userId: 7, role: Role.Student });
  });

  it('acceso con rol insuficiente a subida', () => {
    const guard = new RolesGuard(reflectorReturning([Role.Professor, Role.Admin]));
    const ctx = httpCtx({ authorization: 'Bearer jwt.7.Student' });
    (ctx.switchToHttp().getRequest() as { user?: unknown }).user = { userId: 7, role: Role.Student };
    expect(httpStatusOf(() => void guard.canActivate(ctx))).toBe(403);
  });

  it('rol suficiente pasa (Professor sube)', () => {
    const guard = new RolesGuard(reflectorReturning([Role.Professor, Role.Admin]));
    const ctx = httpCtx({ authorization: 'Bearer jwt.3.Professor' });
    (ctx.switchToHttp().getRequest() as { user?: unknown }).user = { userId: 3, role: Role.Professor };
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it.each([
    ['BAD_REQUEST', 400],
    ['UNAUTHORIZED', 401],
    ['FORBIDDEN', 403],
    ['NOT_FOUND', 404],
    ['CONFLICT', 409],
    ['PAYLOAD_TOO_LARGE', 413],
    ['UNSUPPORTED_MEDIA', 415],
    ['INTERNAL', 500],
  ] as const)('mapper DomainError %s -> HTTP %i', (code, status) => {
    expect(httpStatusOf(() => toHttp(new DomainError(code, 'x')))).toBe(status);
  });
});

describe('AuthController delegacion (UC-001 borde HTTP)', () => {
  it('register delega al usecase y responde 201 sin password', async () => {
    const { register, login } = setupAuth();
    const controller = new AuthController(register, login);
    const out = (await controller.registerUser({ email: 'nuevo@biblio.tech', password: 'Segura123' } as never)) as Record<
      string,
      unknown
    >;
    expect(out['token']).toMatch(/^jwt\./);
    expect(out).not.toHaveProperty('password');
  });

  it('register duplicado mapea a 409 via mapper', async () => {
    const { register, login } = setupAuth();
    const controller = new AuthController(register, login);
    await controller.registerUser({ email: 'dup@biblio.tech', password: 'Segura123' } as never);
    await expect(
      controller.registerUser({ email: 'dup@biblio.tech', password: 'Segura123' } as never),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('login delega al usecase y responde 200 con token', async () => {
    const { register, login } = setupAuth();
    const controller = new AuthController(register, login);
    await controller.registerUser({ email: 'l@biblio.tech', password: 'Segura123' } as never);
    const out = (await controller.loginUser({ email: 'l@biblio.tech', password: 'Segura123' } as never)) as Record<
      string,
      unknown
    >;
    expect(out['token']).toMatch(/^jwt\./);
  });

  it('login con credencial mala mapea a 401 opaco', async () => {
    const { register, login } = setupAuth();
    const controller = new AuthController(register, login);
    await expect(controller.loginUser({ email: 'x@biblio.tech', password: 'Segura123' } as never)).rejects.toMatchObject({
      status: 401,
    });
  });
});

describe('UsersController superficie HTTP (FR-011 / UC-004)', () => {
  const reqAdmin = { headers: { authorization: 'Bearer jwt.1.Admin' }, user: { userId: 1, role: Role.Admin } } as never;

  it('list como Admin devuelve publicos sin hash', async () => {
    const { w, register, manage } = setupAuth();
    await w.users.save(User.create({ email: 'u@biblio.tech', passwordHash: 'h', role: Role.Student }));
    const controller = new UsersController(register, manage);
    const out = (await controller.list(reqAdmin)) as Array<Record<string, unknown>>;
    expect(out).toHaveLength(1);
    for (const u of out) {
      expect(u).not.toHaveProperty('passwordHash');
      expect(u).not.toHaveProperty('password');
    }
  });

  it('list sin user da 401', async () => {
    const { register, manage } = setupAuth();
    const controller = new UsersController(register, manage);
    await expect(controller.list({ headers: {} } as never)).rejects.toMatchObject({ status: 401 });
  });

  it('create como Admin con requestedRole respeta el rol', async () => {
    const { register, manage } = setupAuth();
    const controller = new UsersController(register, manage);
    const out = (await controller.create(reqAdmin, {
      email: 'p@biblio.tech',
      password: 'Segura123',
      requestedRole: 'Professor',
    } as never)) as Record<string, unknown>;
    expect(out['role']).toBe(Role.Professor);
  });

  it('changeRole como Admin devuelve 200 con el rol nuevo', async () => {
    const { w, register, manage } = setupAuth();
    const u = await w.users.save(User.create({ email: 'u@biblio.tech', passwordHash: 'h', role: Role.Student }));
    const controller = new UsersController(register, manage);
    const out = (await controller.changeRole(reqAdmin, u.id as number, { role: 'Professor' } as never)) as Record<
      string,
      unknown
    >;
    expect(out['role']).toBe(Role.Professor);
  });

  it('changeRole con rol invalido da 400', async () => {
    const { w, register, manage } = setupAuth();
    const u = await w.users.save(User.create({ email: 'u@biblio.tech', passwordHash: 'h', role: Role.Student }));
    const controller = new UsersController(register, manage);
    await expect(controller.changeRole(reqAdmin, u.id as number, { role: 'Jefe' } as never)).rejects.toMatchObject({
      status: 400,
    });
  });

  it('remove como Admin resuelve (ruta del 204)', async () => {
    const { w, register, manage } = setupAuth();
    const u = await w.users.save(User.create({ email: 'u@biblio.tech', passwordHash: 'h', role: Role.Student }));
    const controller = new UsersController(register, manage);
    await expect(controller.remove(reqAdmin, u.id as number)).resolves.toBeUndefined();
    expect(await w.users.findById(u.id as number)).toBeNull();
  });

  it('remove sin user da 401', async () => {
    const { register, manage } = setupAuth();
    const controller = new UsersController(register, manage);
    await expect(controller.remove({ headers: {} } as never, 5)).rejects.toMatchObject({ status: 401 });
  });
});
