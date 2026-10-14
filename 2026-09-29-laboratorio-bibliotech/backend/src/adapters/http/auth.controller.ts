// UC-001 [Controller-Adapter] — AuthController solo delega al usecase
// (toda la logica vive en RegisterUserUseCase/LoginUseCase).
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { RegisterUserUseCase } from '../../usecases/register-user.usecase';
import { LoginUseCase } from '../../usecases/login.usecase';
import { Role } from '../../entities/role';
import { toHttp } from './domain-error.mapper';
import { Public } from './guards';
import { RegisterDto, LoginDto } from './dtos';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly register: RegisterUserUseCase,
    private readonly login: LoginUseCase,
  ) {}

  @Public()
  @Post('register')
  async registerUser(@Body() body: RegisterDto): Promise<unknown> {
    try {
      // Registro publico: siempre Student (UC-001). El rol lo fija Admin via UsersController.
      return await this.register.execute({
        email: body.email,
        password: body.password,
        requestedRole: body.requestedRole as Role | undefined,
      });
    } catch (e) {
      toHttp(e);
    }
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async loginUser(@Body() body: LoginDto): Promise<unknown> {
    try {
      return await this.login.execute({ email: body.email, password: body.password });
    } catch (e) {
      toHttp(e);
    }
  }
}
