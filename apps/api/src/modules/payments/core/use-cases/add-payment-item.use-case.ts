import { Inject, Injectable } from '@nestjs/common';
import { CreatePaymentItem } from '../entities/payment-item.entity';
import { PAYMENTS_REPOSITORY } from '../ports/tokens';
import * as paymentRepository from '../ports/payment.repository';

@Injectable()
export class AddPaymentItemUseCase {
  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: paymentRepository.PaymentsRepositoryPort,
  ) {}

  async execute(paymentId: string, items: CreatePaymentItem[]) {
    await this.paymentsRepo.addItems(paymentId, items);
  }
}
