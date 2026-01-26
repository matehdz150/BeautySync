import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';
import { JwtAuthGuard } from '../auth/manager/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/manager/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
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
