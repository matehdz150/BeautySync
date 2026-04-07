// core/use-cases/validate-coupon.use-case.ts

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { COUPON_REPOSITORY } from '../ports/tokens';
import { CouponRepository } from '../ports/coupon.repository';

@Injectable()
export class ValidateCouponUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly repo: CouponRepository,
  ) {}

  async execute(input: {
    code: string;
    branchId: string;
    amountCents: number;
    publicUserId?: string;
    serviceIds?: string[];
  }) {
    const coupon = await this.repo.findByCode(input.code, input.branchId);

    if (!coupon) {
      throw new NotFoundException('Cupón inválido');
    }

    // =========================
    // VALIDATIONS
    // =========================
    if (!coupon.isActive) {
      throw new BadRequestException('Cupón inactivo');
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('Cupón expirado');
    }

    if (
      coupon.assignedToUserId &&
      coupon.assignedToUserId !== input.publicUserId
    ) {
      throw new BadRequestException('Este cupón no es para ti');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Cupón agotado');
    }

    if (coupon.minAmountCents && input.amountCents < coupon.minAmountCents) {
      throw new BadRequestException('No cumple monto mínimo');
    }

    const allowedServices = await this.repo.getServices(coupon.id);

    // 🔥 solo valida si:
    if (allowedServices.length > 0) {
      if (!input.serviceIds?.length) {
        throw new BadRequestException(
          'Este cupón requiere servicios específicos',
        );
      }

      const hasValidService = input.serviceIds.some((id) =>
        allowedServices.includes(id),
      );

      if (!hasValidService) {
        throw new BadRequestException(
          'Cupón no aplica a los servicios seleccionados',
        );
      }
    }

    // =========================
    // CALCULATE DISCOUNT
    // =========================
    let discount = 0;

    if (coupon.type === 'percentage') {
      discount = Math.round((input.amountCents * coupon.value) / 100);
    } else {
      discount = coupon.value;
    }

    if (coupon.maxDiscountCents) {
      discount = Math.min(discount, coupon.maxDiscountCents);
    }

    return {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type, // "percentage" | "fixed"
        value: coupon.value, // 20 o 500
      },
      discountCents: discount,
      finalAmount: input.amountCents - discount,
    };
  }
}
