import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class GetCalendarWeekSummaryDto {
  @IsUUID()
  branchId!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;
}
