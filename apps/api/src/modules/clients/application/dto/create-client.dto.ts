import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { ClientProfileDto } from './client-profile.dto';
import { Type } from 'class-transformer';

export class CreateClientDto {
  @IsUUID()
  organizationId!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClientProfileDto)
  profile?: ClientProfileDto;
}
