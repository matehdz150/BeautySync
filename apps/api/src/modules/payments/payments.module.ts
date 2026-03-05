import { Module } from '@nestjs/common';
import { PaymentsController } from './application/controllers/payment.controller';
import { PAYMENTS_REPOSITORY } from './core/ports/tokens';
import { AddPaymentItemUseCase } from './core/use-cases/add-payment-item.use-case';
import { CreatePaymentUseCase } from './core/use-cases/create-payment.use-case';
import { MarkPaymentPaidUseCase } from './core/use-cases/mark-payment-paid.use-case';
import { DrizzlePaymentsRepository } from './infrastructure/adapters/payments-drizzle.repository';
import { AuthModule } from '../auth/manager/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController],
  providers: [
    CreatePaymentUseCase,
    AddPaymentItemUseCase,
    MarkPaymentPaidUseCase,

    {
      provide: PAYMENTS_REPOSITORY,
      useClass: DrizzlePaymentsRepository,
    },
  ],
})
export class PaymentsModule {}
