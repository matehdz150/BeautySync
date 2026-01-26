import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreateManagerBookingDto {
  @IsUUID()
  branchId!: string;

  @IsOptional()
  @IsUUID()
  clientId?: string | null;

  @IsDateString()
  date!: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManagerAppointmentDraftDto)
  appointments!: ManagerAppointmentDraftDto[];
}

class ManagerAppointmentDraftDto {
  @IsUUID()
  serviceId!: string;

  @IsUUID()
  staffId!: string;

  @IsString()
  startIso!: string;

  @IsOptional()
  durationMin?: number;
}
