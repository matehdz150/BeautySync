import { IsString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateGiftCardDto {
  @IsUUID()
  branchId!: string;

  @IsInt()
  @Min(1)
  initialAmountCents!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  expiresAt?: string; // ISO

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;
}
