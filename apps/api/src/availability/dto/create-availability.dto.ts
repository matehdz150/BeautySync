/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class GetAvailabilityDto {
  @IsUUID()
  branchId!: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  // día a consultar, formato "YYYY-MM-DD"
  @IsDateString()
  date!: string;

  @IsUUID()
  @IsOptional()
  staffId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  requiredDurationMin?: number;
}
