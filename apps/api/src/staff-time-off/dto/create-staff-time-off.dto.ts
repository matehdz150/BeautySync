/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateStaffTimeOffDto {
  @IsUUID()
  staffId!: string;

  @IsDateString()
  start!: string;

  @IsDateString()
  end!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
