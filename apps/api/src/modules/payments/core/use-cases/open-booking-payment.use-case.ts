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
    const services = await this.bookingsRepo.findBookingServices(
      data.bookingId,
    );

    const payment = await this.paymentsRepo.createPayment({
      organizationId: data.organizationId,
      branchId: data.branchId,
      cashierStaffId: data.cashierStaffId,
      clientId: data.clientId ?? null,
      bookingId: data.bookingId,

      status: 'pending',

      subtotalCents: 0,
      discountsCents: 0,
      taxCents: 0,
      totalCents: 0,
    });

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
    }

    return payment;
  }
}
