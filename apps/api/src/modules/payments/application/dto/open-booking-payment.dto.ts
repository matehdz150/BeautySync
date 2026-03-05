import { IsUUID, IsOptional } from 'class-validator';

export class OpenBookingPaymentDto {
  @IsUUID()
  bookingId!: string;

  @IsUUID()
  organizationId!: string;

  @IsUUID()
  branchId!: string;

  @IsUUID()
  cashierStaffId!: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;
}
