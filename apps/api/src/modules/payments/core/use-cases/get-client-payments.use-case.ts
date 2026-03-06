import { Inject, Injectable } from '@nestjs/common';

import { PAYMENTS_REPOSITORY } from '../ports/tokens';
import { BOOKINGS_REPOSITORY } from '../ports/tokens';

import * as paymentRepository from '../ports/payment.repository';
import * as bookingsRepository from '../ports/bookings.repository';

import { ClientPaymentDetails } from '../entities/payment.entity';

@Injectable()
export class GetClientPaymentsUseCase {
  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: paymentRepository.PaymentsRepositoryPort,

    @Inject(BOOKINGS_REPOSITORY)
    private readonly bookingsRepo: bookingsRepository.BookingsRepositoryPort,
  ) {}

  async execute(clientId: string): Promise<ClientPaymentDetails[]> {
    /* =========================
       1️⃣ Obtener payments del cliente
    ========================= */

    const payments = await this.paymentsRepo.findByClientId(clientId);

    if (!payments.length) {
      return [];
    }

    /* =========================
       2️⃣ Construir respuesta
    ========================= */

    const results: ClientPaymentDetails[] = [];

    for (const payment of payments) {
      const items = await this.paymentsRepo.getItems(payment.id);

      let booking: { id: string } | null = null;

      if (payment.bookingId) {
        const bookingData = await this.bookingsRepo.findById(payment.bookingId);

        if (bookingData) {
          booking = { id: bookingData.id };
        }
      }

      results.push({
        payment,
        items,
        booking,
      });
    }

    return results;
  }
}
