import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(dto);
  }

  @Get('by-appointment/:appointmentId')
  getByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.paymentsService.getPaymentByAppointmentId(appointmentId);
  }

  @Get()
  list(@Query() query: ListPaymentsDto) {
    return this.paymentsService.listPayments(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.paymentsService.getPaymentById(id);
  }
}
