/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsInt, IsUUID, Max, Min, IsString, Matches } from 'class-validator';

export class CreateStaffScheduleDto {
  @IsUUID()
  staffId!: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be HH:mm' })
  startTime!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be HH:mm' })
  endTime!: string;
}
