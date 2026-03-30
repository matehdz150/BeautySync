import { IsString, IsInt, Min, IsUUID } from 'class-validator';

export class RedeemGiftCardDto {
  @IsString()
  code!: string;

  @IsInt()
  @Min(1)
  amountCents!: number;

  @IsUUID()
  branchId!: string;
}
