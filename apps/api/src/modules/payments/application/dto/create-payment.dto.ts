// payments/dto/create-payment.dto.ts

import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { paymentMethodEnum } from 'src/modules/db/schema';

export class CreatePaymentDto {
  /* =====================
     CONTEXTO
  ===================== */

  @IsUUID()
  organizationId!: string;

  @IsUUID()
  branchId!: string;

  @IsUUID()
  cashierStaffId!: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsUUID()
  @IsOptional()
  bookingId?: string;

  /* =====================
     MÉTODO DE PAGO
  ===================== */

  @IsEnum(paymentMethodEnum.enumValues)
  paymentMethod!: (typeof paymentMethodEnum.enumValues)[number];

  @IsOptional()
  @IsString()
  paymentProvider?: string;

  @IsOptional()
  @IsString()
  externalReference?: string;

  /* =====================
     METADATA
  ===================== */

  @IsOptional()
  @IsString()
  notes?: string;
}
