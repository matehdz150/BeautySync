import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/manager/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/manager/guards/roles.guard';

import { AddPaymentItemsDto } from '../dto/add-payment-item.dto';
import { OpenPaymentDto } from '../dto/open-payment.dto';
import { OpenBookingPaymentDto } from '../dto/open-booking-payment.dto';

import { OpenPaymentUseCase } from '../../core/use-cases/open-payment.use-case';
import { OpenBookingPaymentUseCase } from '../../core/use-cases/open-booking-payment.use-case';
import { AddPaymentItemUseCase } from '../../core/use-cases/add-payment-item.use-case';
import { RemovePaymentItemUseCase } from '../../core/use-cases/remove-payment-item.use-case';
import { FinalizePaymentUseCase } from '../../core/use-cases/finalize-payment.use-case';
import { CancelPaymentUseCase } from '../../core/use-cases/cancel-payment.use-case';
import { GetPaymentUseCase } from '../../core/use-cases/get-payment.use-case';
import { FinalizePaymentDto } from '../dto/finalize-payment.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly openPayment: OpenPaymentUseCase,
    private readonly openBookingPayment: OpenBookingPaymentUseCase,
    private readonly addItems: AddPaymentItemUseCase,
    private readonly removeItem: RemovePaymentItemUseCase,
    private readonly finalizePayment: FinalizePaymentUseCase,
    private readonly cancelPayment: CancelPaymentUseCase,
    private readonly getPayment: GetPaymentUseCase,
  ) {}

  /* =====================
     OPEN PAYMENT (POS)
  ===================== */

  @Post('open')
  open(@Body() dto: OpenPaymentDto) {
    return this.openPayment.execute(dto);
  }

  /* =====================
     OPEN BOOKING PAYMENT
  ===================== */

  @Post('open-booking')
  openBooking(@Body() dto: OpenBookingPaymentDto) {
    return this.openBookingPayment.execute(dto);
  }

  /* =====================
     ADD ITEMS
  ===================== */

  @Post(':id/items')
  addItemsToPayment(
    @Param('id') paymentId: string,
    @Body() dto: AddPaymentItemsDto,
  ) {
    return this.addItems.execute(paymentId, dto.items);
  }

  /* =====================
     REMOVE ITEM
  ===================== */

  @Delete(':paymentId/items/:itemId')
  removeItemFromPayment(
    @Param('paymentId') paymentId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.removeItem.execute(paymentId, itemId);
  }

  /* =====================
     FINALIZE PAYMENT
  ===================== */

  @Post(':id/finalize')
  finalize(@Param('id') paymentId: string, @Body() dto: FinalizePaymentDto) {
    return this.finalizePayment.execute(paymentId, dto.method);
  }

  /* =====================
     CANCEL PAYMENT
  ===================== */

  @Post(':id/cancel')
  cancel(@Param('id') paymentId: string) {
    return this.cancelPayment.execute(paymentId);
  }

  /* =====================
     GET PAYMENT
  ===================== */

  @Get(':id')
  get(@Param('id') paymentId: string) {
    return this.getPayment.execute(paymentId);
  }
}
