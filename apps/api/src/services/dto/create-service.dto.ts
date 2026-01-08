/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @IsUUID()
  organizationId!: string;

  @IsUUID()
  branchId!: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  durationMin!: number;

  @IsInt()
  @IsOptional()
  priceCents?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  notes?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serviceRules?: string[];
}
