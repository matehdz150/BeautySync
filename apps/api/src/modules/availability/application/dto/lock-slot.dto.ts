import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsInt,
} from 'class-validator';

export class LockSlotDto {
  @IsUUID()
  branchId!: string;

  @IsUUID()
  staffId!: string;

  @IsISO8601()
  startIso!: string;

  @IsISO8601()
  endIso!: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  ttlSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  stepMin?: number;

  @IsString()
  ownerToken!: string;
}
