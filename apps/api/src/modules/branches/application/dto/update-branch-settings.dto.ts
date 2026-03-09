// src/modules/branch/dto/update-branch-settings.dto.ts
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateBranchSettingsDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minBookingNoticeMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxBookingAheadDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  cancelationWindowMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rescheduleWindowMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bufferBeforeMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bufferAfterMin?: number;
}
