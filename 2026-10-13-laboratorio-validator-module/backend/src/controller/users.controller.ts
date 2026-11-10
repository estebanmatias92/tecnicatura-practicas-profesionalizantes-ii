import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Role } from '../model/entities/enums';
import type { User } from '../model/entities/user.entity';
import { UserService } from '../model/services/user.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { toUserResponse } from './dto/responses';
import { CreateUserDto, UpdateRoleDto } from './dto/user.dto';

@Controller('users')
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly users: UserService) {}

  @Get()
  async list() {
    const users = await this.users.list();
    return { items: users.map(toUserResponse) };
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return toUserResponse(await this.users.create(dto));
  }

  @Patch(':id/role')
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() actor: User,
  ) {
    return toUserResponse(await this.users.updateRole(id, dto.role, actor));
  }
}
