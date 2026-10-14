// Adapters HTTP — DTOs con class-validator (defensa en el borde; la fuente
// de verdad sigue siendo ValidatorPort en el usecase, ADR-0002).
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsInt, Min, Max, IsArray, ArrayMaxSize, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsIn(['Admin', 'Professor', 'Student'])
  requestedRole?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class UploadMetaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  author!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subject?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  @Max(new Date().getFullYear())
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  edition?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  author?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subject?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  @Max(new Date().getFullYear())
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  edition?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  tags?: string[];
}

export class ChangeRoleDto {
  @IsIn(['Admin', 'Professor', 'Student'])
  role!: string;
}
