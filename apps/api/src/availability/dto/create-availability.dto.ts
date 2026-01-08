/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class GetAvailabilityDto {
  @IsUUID()
  branchId!: string;

  @IsUUID()
  serviceId!: string;

  // día a consultar, formato "YYYY-MM-DD"
  @IsDateString()
  date!: string;

  @IsUUID()
  @IsOptional()
  staffId?: string;
}
