/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsOptional, IsString, IsUUID } from 'class-validator';
import * as schema from 'src/modules/db/schema';

export class UpdateStatusDto {
  @IsString()
  status!: schema.AppointmentStatus;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsUUID()
  changedByUserId?: string;
}
