import { IsUUID, IsDateString, IsOptional } from 'class-validator';

export class GetCalendarDayDto {
  @IsUUID()
  branchId!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;
}
