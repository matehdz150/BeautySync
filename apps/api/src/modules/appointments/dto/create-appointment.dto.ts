/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  branchId!: string;

  @IsUUID()
  serviceId!: string;

  @IsUUID()
  staffId!: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsDateString()
  start!: string; // UTC ISO — ejemplo: "2025-02-10T15:00:00Z"

  @IsOptional()
  @IsString()
  notes?: string;
}
