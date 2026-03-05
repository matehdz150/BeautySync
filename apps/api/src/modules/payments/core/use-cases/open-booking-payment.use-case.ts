import { Inject, Injectable } from '@nestjs/common';
import { PAYMENTS_REPOSITORY } from '../ports/tokens';
import { BOOKINGS_REPOSITORY } from '../ports/tokens';

import * as paymentRepository from '../ports/payment.repository';
import * as bookingsRepository from '../ports/bookings.repository';

import { CreatePaymentItem } from '../entities/payment-item.entity';

@Injectable()
export class OpenBookingPaymentUseCase {
  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: paymentRepository.PaymentsRepositoryPort,

    @Inject(BOOKINGS_REPOSITORY)
    private readonly bookingsRepo: bookingsRepository.BookingsRepositoryPort,
  ) {}

  async execute(data: {
    bookingId: string;
    organizationId: string;
    branchId: string;
    cashierStaffId: string;
    clientId?: string;
  }) {
    /* =========================
     1️⃣ Obtener cliente
  ========================= */

    const client = data.clientId
      ? { id: data.clientId }
      : await this.bookingsRepo.findBookingClient(data.bookingId);

    /* =========================
     2️⃣ Servicios
  ========================= */

    const services = await this.bookingsRepo.findBookingServices(
      data.bookingId,
    );

    /* =========================
     3️⃣ Crear payment
  ========================= */

    const payment = await this.paymentsRepo.createPayment({
      organizationId: data.organizationId,
      branchId: data.branchId,
      cashierStaffId: data.cashierStaffId,
      clientId: client?.id ?? null,
      bookingId: data.bookingId,
      status: 'pending',
      subtotalCents: 0,
      discountsCents: 0,
      taxCents: 0,
      totalCents: 0,
    });

    /* =========================
     4️⃣ Items
  ========================= */

    if (services.length > 0) {
      const items = services.map(
        (service) =>
          new CreatePaymentItem(
            'service',
            service.name,
            service.priceCents,
            service.id,
            service.staffId ?? null,
          ),
      );

      await this.paymentsRepo.addItems(payment.id, items);

      const subtotal = items.reduce((sum, i) => sum + i.amountCents, 0);

      await this.paymentsRepo.updateTotals(payment.id, {
        subtotalCents: subtotal,
        discountsCents: 0,
        taxCents: 0,
        totalCents: subtotal,
      });
    }

    const items = await this.paymentsRepo.getItems(payment.id);

    const subtotal = items.reduce((s, i) => s + i.amountCents, 0);

    return {
      ...payment,
      client,
      items,
      subtotalCents: subtotal,
      totalCents: subtotal,
    };
  }
}
