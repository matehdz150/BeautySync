import { IsUUID, IsDateString, IsISO8601 } from 'class-validator';

export class GetAvailabilityForSlotDto {
  @IsUUID()
  branchId!: string;

  @IsUUID()
  staffId!: string;

  @IsDateString()
  datetime!: string; // ISO exact datetime
}

export class AvailableServicesAtDto {
  @IsUUID()
  branchId!: string;

  @IsISO8601()
  datetime!: string; // ISO (UTC o local)
}
