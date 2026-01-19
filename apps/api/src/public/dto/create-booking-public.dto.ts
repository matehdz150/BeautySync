import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export type PublicPaymentMethod = 'ONSITE' | 'ONLINE';

class PublicAppointmentDraftDto {
  @IsUUID()
  serviceId!: string;

  @IsString()
  staffId!: string; // UUID o "ANY"

  @IsString()
  startIso!: string; // local iso con offset

  @IsString()
  endIso!: string; // local iso con offset (lo usamos para validar coherencia, pero no confiamos 100%)

  @IsOptional()
  durationMin?: number; // opcional (no confiamos)
}

export class CreatePublicBookingDto {
  @IsString()
  branchSlug!: string;

  @IsDateString()
  date!: string; // YYYY-MM-DD

  @IsEnum(['ONSITE', 'ONLINE'])
  paymentMethod!: PublicPaymentMethod;

  @IsOptional()
  @IsString()
  discountCode?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublicAppointmentDraftDto)
  appointments!: PublicAppointmentDraftDto[];
}
