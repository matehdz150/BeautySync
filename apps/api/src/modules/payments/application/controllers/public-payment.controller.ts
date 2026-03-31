import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { GetAvailablePaymentBenefitsUseCase } from '../../core/use-cases/get-available-benefits.use-case';
import { GetUserBySessionUseCase } from 'src/modules/auth/core/use-cases/public/get-user-by-session.use-case';
import { PublicAuthGuard } from 'src/modules/auth/application/guards/public-auth.guard';
import { PublicUser } from 'src/modules/auth/application/decorators/public-user.decorator';

@Controller('public-payments') // puedes cambiar a 'public/payments' si quieres aislarlo más
export class PublicPaymentsController {
  constructor(
    private readonly getAvailableBenefits: GetAvailablePaymentBenefitsUseCase,
    private readonly getUserBySessionUseCase: GetUserBySessionUseCase,
  ) {}

  @Get('benefits')
  @UseGuards(PublicAuthGuard)
  async getBenefits(
    @Query('branchId') branchId: string,
    @PublicUser() user: { publicUserId: string },
  ) {
    // 🔥 misma validación que booking
    if (!branchId) {
      throw new BadRequestException('branchId is required');
    }

    return this.getAvailableBenefits.execute({
      branchId,
      publicUserId: user.publicUserId,
    });
  }
}
