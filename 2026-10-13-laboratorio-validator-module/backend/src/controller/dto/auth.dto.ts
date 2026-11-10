import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'validation.email.invalid' })
  @MaxLength(255, { message: 'validation.email.too-long', context: { max: 255 } })
  email!: string;

  @IsString({ message: 'validation.password.not-string' })
  @MinLength(8, { message: 'validation.password.too-short', context: { min: 8 } })
  @MaxLength(72, { message: 'validation.password.too-long', context: { max: 72 } })
  password!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'validation.email.invalid' })
  @MaxLength(255, { message: 'validation.email.too-long', context: { max: 255 } })
  email!: string;

  @IsString({ message: 'validation.password.not-string' })
  @MaxLength(72, { message: 'validation.password.too-long', context: { max: 72 } })
  password!: string;
}