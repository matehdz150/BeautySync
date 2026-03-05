// payments/dto/list-payments.dto.ts

import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

import { paymentStatusEnum } from 'src/modules/db/schema';

export class ListPaymentsDto {
  @IsUUID()
  branchId!: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  cashierStaffId?: string;

  @IsOptional()
  @IsEnum(paymentStatusEnum.enumValues)
  status?: (typeof paymentStatusEnum.enumValues)[number];

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
