/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsUUID, MinLength, IsOptional } from 'class-validator';

export class CreateBranchDto {
  @IsUUID()
  organizationId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @IsOptional()
  address?: string;
}
