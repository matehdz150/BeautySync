import { Inject, Injectable } from '@nestjs/common';
import * as paymentRepository from '../ports/payment.repository';
import { PAYMENTS_REPOSITORY } from '../ports/tokens';

@Injectable()
export class MarkPaymentPaidUseCase {
  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: paymentRepository.PaymentsRepositoryPort,
  ) {}

  async execute(paymentId: string) {
    await this.paymentsRepo.markPaid(paymentId, new Date());
  }
}
