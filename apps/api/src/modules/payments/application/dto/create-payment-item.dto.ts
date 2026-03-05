// payments/dto/create-payment-item.dto.ts

import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { paymentItemTypeEnum } from 'src/modules/db/schema';

export class CreatePaymentItemDto {
  @IsEnum(paymentItemTypeEnum.enumValues)
  type!: (typeof paymentItemTypeEnum.enumValues)[number];

  @IsString()
  label!: string;

  @IsNumber()
  amountCents!: number;

  @IsUUID()
  @IsOptional()
  referenceId?: string;

  @IsUUID()
  @IsOptional()
  staffId?: string;

  @IsOptional()
  meta?: Record<string, any>;
}
