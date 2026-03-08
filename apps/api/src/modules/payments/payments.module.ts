import { Module } from '@nestjs/common';
import { PaymentsController } from './application/controllers/payment.controller';
import { BOOKINGS_REPOSITORY, PAYMENTS_REPOSITORY } from './core/ports/tokens';
import { AddPaymentItemUseCase } from './core/use-cases/add-payment-item.use-case';
import { CreatePaymentUseCase } from './core/use-cases/create-payment.use-case';
import { MarkPaymentPaidUseCase } from './core/use-cases/mark-payment-paid.use-case';
import { DrizzlePaymentsRepository } from './infrastructure/adapters/payments-drizzle.repository';
import { AuthModule } from '../auth/auth.module';
import { OpenBookingPaymentUseCase } from './core/use-cases/open-booking-payment.use-case';
import { OpenPaymentUseCase } from './core/use-cases/open-payment.use-case';
import { RecalculatePaymentTotalsUseCase } from './core/use-cases/recalculate-payment-totals.use-case';
import { RemovePaymentItemUseCase } from './core/use-cases/remove-payment-item.use-case';
import { FinalizePaymentUseCase } from './core/use-cases/finalize-payment.use-case';
import { CancelPaymentUseCase } from './core/use-cases/cancel-payment.use-case';
import { GetPaymentUseCase } from './core/use-cases/get-payment.use-case';
import { DrizzleBookingsRepository } from './infrastructure/adapters/drizzle-bookings.repository';
import { AssignClientToPaymentUseCase } from './core/use-cases/assign-client-to-payment.use-case';
import { GetClientPaymentsUseCase } from './core/use-cases/get-client-payments.use-case';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController],
  providers: [
    CreatePaymentUseCase,
    AddPaymentItemUseCase,
    MarkPaymentPaidUseCase,
    OpenBookingPaymentUseCase,
    OpenPaymentUseCase,
    RecalculatePaymentTotalsUseCase,
    RemovePaymentItemUseCase,
    FinalizePaymentUseCase,
    CancelPaymentUseCase,
    GetPaymentUseCase,
    AssignClientToPaymentUseCase,
    GetClientPaymentsUseCase,
    {
      provide: PAYMENTS_REPOSITORY,
      useClass: DrizzlePaymentsRepository,
    },
    {
      provide: BOOKINGS_REPOSITORY,
      useClass: DrizzleBookingsRepository,
    },
  ],
})
export class PaymentsModule {}
