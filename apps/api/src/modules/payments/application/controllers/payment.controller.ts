import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/manager/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/manager/guards/roles.guard';

import { CreatePaymentDto } from '../dto/create-payment.dto';
import { ListPaymentsDto } from '../dto/list-payments.dto';

import { CreatePaymentUseCase } from '../../core/use-cases/create-payment.use-case';
import { AddPaymentItemUseCase } from '../../core/use-cases/add-payment-item.use-case';
import { MarkPaymentPaidUseCase } from '../../core/use-cases/mark-payment-paid.use-case';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly createPayment: CreatePaymentUseCase,
    private readonly addItems: AddPaymentItemUseCase,
    private readonly markPaid: MarkPaymentPaidUseCase,
  ) {}

  /* =====================
     CREATE PAYMENT
  ===================== */

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.createPayment.execute(dto);
  }

  /* =====================
     ADD ITEMS TO PAYMENT
  ===================== */

  @Post(':id/items')
  addItemsToPayment(@Param('id') paymentId: string, @Body() items: any[]) {
    return this.addItems.execute(paymentId, items);
  }

  /* =====================
     MARK PAYMENT AS PAID
  ===================== */

  @Post(':id/pay')
  pay(@Param('id') paymentId: string) {
    return this.markPaid.execute(paymentId);
  }

  /* =====================
     LIST PAYMENTS
  ===================== */

  @Get()
  list(@Query() query: ListPaymentsDto) {
    // este endpoint lo implementarás luego
    return {
      message: 'list payments not implemented yet',
      query,
    };
  }

  /* =====================
     GET PAYMENT BY ID
  ===================== */

  @Get(':id')
  getById(@Param('id') id: string) {
    return {
      message: 'get payment by id not implemented yet',
      id,
    };
  }
}
