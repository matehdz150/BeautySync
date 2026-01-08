// dto/admin-create-user.dto.ts
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class AdminCreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsIn(['owner', 'admin', 'manager', 'staff'])
  role: 'owner' | 'admin' | 'manager' | 'staff';

  @IsOptional()
  organizationId?: string;
}
