import { IsEnum } from 'class-validator';
import * as paymentRepository from '../../core/ports/payment.repository';

export class FinalizePaymentDto {
  @IsEnum(['cash', 'card', 'terminal', 'transfer', 'qr', 'gift_card'])
  method!: paymentRepository.PaymentMethod;
}
