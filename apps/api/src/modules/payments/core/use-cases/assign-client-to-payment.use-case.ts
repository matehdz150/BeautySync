import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PAYMENTS_REPOSITORY } from '../ports/tokens';
import * as paymentRepository from '../ports/payment.repository';

@Injectable()
export class AssignClientToPaymentUseCase {
  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: paymentRepository.PaymentsRepositoryPort,
  ) {}

  async execute(paymentId: string, clientId: string) {
    const payment = await this.paymentsRepo.findById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    /* =====================
       STATUS VALIDATION
    ===================== */

    if (payment.status !== 'pending') {
      throw new BadRequestException(
        'Cannot assign client to finalized payment',
      );
    }

    /* =====================
       BOOKING VALIDATION
    ===================== */

    if (payment.bookingId) {
      throw new BadRequestException(
        'Use booking client assignment for booking payments',
      );
    }

    await this.paymentsRepo.assignClient(paymentId, clientId);

    return { success: true };
  }
}
