// FR-011 / UC-004 usuarios [Controller-Adapter] — Admin CRUD usuarios.
// Alta con rol via RegisterUserUseCase (requesterRole=Admin); rol, lista y
// baja via ManageMaterialUseCase. Solo delega.
import { Controller, Get, Post, Patch, Delete, Param, Body, Req, ParseIntPipe, HttpCode } from '@nestjs/common';
import { RegisterUserUseCase } from '../../usecases/register-user.usecase';
import { ManageMaterialUseCase } from '../../usecases/manage-material.usecase';
import { Role } from '../../entities/role';
import { DomainError } from '../../usecases/errors';
import { toHttp } from './domain-error.mapper';
import { RequireRoles, type AuthenticatedRequest } from './guards';
import { RegisterDto, ChangeRoleDto } from './dtos';

@Controller('users')
@RequireRoles(Role.Admin)
export class UsersController {
  constructor(
    private readonly register: RegisterUserUseCase,
    private readonly manage: ManageMaterialUseCase,
  ) {}

  private adminOf(req: AuthenticatedRequest): Role {
    if (!req.user) throw new DomainError('UNAUTHORIZED', 'sin JWT');
    return req.user.role;
  }

  @Get()
  async list(@Req() req: AuthenticatedRequest): Promise<unknown> {
    try {
      return await this.manage.listUsers(this.adminOf(req));
    } catch (e) {
      toHttp(e);
    }
  }

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() body: RegisterDto): Promise<unknown> {
    try {
      if (!body.requestedRole) throw new DomainError('BAD_REQUEST', 'requestedRole requerido');
      return await this.register.execute({
        email: body.email,
        password: body.password,
        requestedRole: body.requestedRole as Role,
        requesterRole: this.adminOf(req),
      });
    } catch (e) {
      toHttp(e);
    }
  }

  @Patch(':id')
  async changeRole(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ChangeRoleDto,
  ): Promise<unknown> {
    try {
      return await this.manage.changeUserRole({ callerRole: this.adminOf(req), userId: id, role: body.role as Role });
    } catch (e) {
      toHttp(e);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number): Promise<void> {
    try {
      if (!req.user) throw new DomainError('UNAUTHORIZED', 'sin JWT');
      await this.manage.deleteUser({ callerId: req.user.userId, callerRole: req.user.role, userId: id });
    } catch (e) {
      toHttp(e);
    }
  }
}
