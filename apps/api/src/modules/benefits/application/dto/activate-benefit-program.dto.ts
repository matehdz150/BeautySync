// application/dto/activate-benefit-program.dto.ts

import { IsUUID, IsOptional, IsString } from 'class-validator';

export class ActivateBenefitProgramDto {
  @IsUUID()
  branchId!: string;

  @IsOptional()
  @IsString()
  name?: string;
}
