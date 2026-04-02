import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  IsUUID,
  IsObject,
} from 'class-validator';

export enum BenefitRewardTypeEnum {
  SERVICE = 'SERVICE',
  PRODUCT = 'PRODUCT',
  COUPON = 'COUPON',
  GIFT_CARD = 'GIFT_CARD',
  CUSTOM = 'CUSTOM',
}

export class CreateBenefitRewardDto {
  @IsUUID()
  branchId!: string;

  @IsEnum(BenefitRewardTypeEnum)
  type!: BenefitRewardTypeEnum;

  @IsString()
  name!: string; // 🔥 FIX

  @IsNumber()
  @Min(1)
  pointsCost!: number;

  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
