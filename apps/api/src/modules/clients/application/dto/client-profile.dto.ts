import { IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';

export class ClientProfileDto {
  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  ageRange?: string;

  @IsOptional()
  @IsUUID()
  preferredStaffId?: string;

  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}
