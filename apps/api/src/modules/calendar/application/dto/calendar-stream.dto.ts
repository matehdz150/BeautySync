import { IsUUID } from 'class-validator';

export class CalendarStreamDto {
  @IsUUID()
  branchId!: string;
}
