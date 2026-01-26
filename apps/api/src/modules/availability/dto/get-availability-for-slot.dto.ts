import { IsUUID, IsDateString } from 'class-validator';

export class GetAvailabilityForSlotDto {
  @IsUUID()
  branchId!: string;

  @IsUUID()
  staffId!: string;

  @IsDateString()
  datetime!: string; // ISO exact datetime
}
