import { IsUUID, IsOptional } from 'class-validator';

export class OpenPaymentDto {
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
