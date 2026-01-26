import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBranchSettingsDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  minBookingNoticeMin?: number;

  @IsOptional()
  maxBookingAheadDays?: number;

  @IsOptional()
  cancelationWindowMin?: number;

  @IsOptional()
  bufferBeforeMin?: number;

  @IsOptional()
  bufferAfterMin?: number;
}

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  settings?: CreateBranchSettingsDto;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;
}

export class OnboardOwnerDto {
  @IsString()
  @IsNotEmpty()
  organizationName!: string;

  @IsArray()
  branches!: CreateBranchDto[];
}
