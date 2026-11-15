import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import type { User } from '../model/entities/user.entity';
import { AuthService } from '../model/services/auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { toAuthResponse, toUserResponse } from './dto/responses';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return toAuthResponse(await this.auth.register(dto.email, dto.password));
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return toAuthResponse(await this.auth.login(dto.email, dto.password));
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return toUserResponse(user);
  }
}
