/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsString,
  IsUUID,
  MinLength,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBranchDto {
  @IsUUID()
  organizationId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;
}

export type BranchBasicDto = {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
};
