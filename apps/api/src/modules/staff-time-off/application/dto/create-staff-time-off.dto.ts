import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ArrayNotEmpty,
  IsInt,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateStaffTimeOffRuleDto {
  @IsEnum(['NONE', 'DAILY', 'WEEKLY'])
  recurrenceType!: 'NONE' | 'DAILY' | 'WEEKLY';

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek?: number[];

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime!: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CreateStaffTimeOffDto {
  @IsUUID()
  staffId!: string;

  // =========================
  // SIMPLE TIME OFF
  // =========================

  @IsOptional()
  @IsDateString()
  start?: string;

  @IsOptional()
  @IsDateString()
  end?: string;

  // =========================
  // RULE (RECURRING)
  // =========================

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateStaffTimeOffRuleDto)
  rule?: CreateStaffTimeOffRuleDto;

  // =========================
  // SHARED
  // =========================

  @IsOptional()
  @IsString()
  reason?: string;
}
