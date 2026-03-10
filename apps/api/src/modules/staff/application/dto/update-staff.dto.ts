import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  jobRole?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
