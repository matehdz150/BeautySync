/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsISO8601()
  start!: string; // ISO string en UTC

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsOptional()
  reason?: string;

  @IsOptional()
  @IsUUID()
  changedByUserId?: string;

  @IsString()
  ownerToken!: string;
}
