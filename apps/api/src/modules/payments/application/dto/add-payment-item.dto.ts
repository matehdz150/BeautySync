// payments/dto/add-payment-items.dto.ts

import { IsArray, ValidateNested } from 'class-validator';

import { Type } from 'class-transformer';

import { CreatePaymentItemDto } from './create-payment-item.dto';

export class AddPaymentItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentItemDto)
  items!: CreatePaymentItemDto[];
}
