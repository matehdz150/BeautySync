// payments/dto/create-payment.dto.ts
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  paymentMethodEnum,
  paymentItemTypeEnum,
} from '../../db/schema/payments/payment';

export class CreatePaymentItemDto {
  @IsEnum(paymentItemTypeEnum.enumValues)
  type: 'service' | 'product' | 'discount' | 'fee' | 'tax';

  @IsUUID()
  referenceId?: string;

  @IsString()
  label: string;

  @IsNumber()
  amountCents: number; // +cargo | -descuento

  @IsUUID()
  @IsOptional()
  staffId?: string;

  @IsOptional()
  meta?: Record<string, any>;
}

export class CreatePaymentDto {
  /* CONTEXTO */
  @IsUUID()
  organizationId: string;

  @IsUUID()
  branchId: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @IsUUID()
  cashierStaffId: string;

  /* PAGO */
  @IsEnum(paymentMethodEnum.enumValues)
  paymentMethod: 'cash' | 'card' | 'terminal' | 'transfer' | 'qr' | 'gift_card';

  @IsOptional()
  @IsString()
  paymentProvider?: string;

  @IsOptional()
  @IsString()
  externalReference?: string;

  /* ITEMS */
  @IsArray()
  items: CreatePaymentItemDto[];

  /* METADATA */
  @IsOptional()
  @IsString()
  notes?: string;
}
