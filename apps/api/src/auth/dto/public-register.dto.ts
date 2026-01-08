// dto/public-register.dto.ts
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class PublicRegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsIn(['manager', 'staff']) // ⬅️ SOLO estos dos
  role: 'manager' | 'staff';
}
