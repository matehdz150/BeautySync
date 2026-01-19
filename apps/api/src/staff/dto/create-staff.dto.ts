import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateStaffDto {
  @IsUUID()
  branchId!: string;

  // 👉 userId ya NO lo manda el frontend
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  jobRole?: string;
}
