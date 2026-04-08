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
    serviceItems?: Array<{
      serviceId: string;
      amountCents: number;
    }>;
  }) {
    const toMoney = (cents: number) =>
      `$${(Math.max(cents, 0) / 100).toFixed(2)}`;
    const toDate = (date: Date) => date.toISOString().slice(0, 10);
    const fail = (reason: string): never => {
      throw new BadRequestException(`Cupón no aplicable: ${reason}`);
    };

    const coupon = await this.repo.findByCode(input.code, input.branchId);

    if (!coupon) {
      throw new NotFoundException('Cupón inválido');
    }

    // =========================
    // VALIDATIONS
    // =========================
    if (!coupon.isActive) {
      fail('está inactivo.');
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      fail(`expiró el ${toDate(coupon.expiresAt)}.`);
    }

    if (
      coupon.assignedToUserId &&
      coupon.assignedToUserId !== input.publicUserId
    ) {
      fail('está asignado a otro usuario.');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      fail(
        `alcanzó su límite de uso (${coupon.usedCount}/${coupon.usageLimit}).`,
      );
    }

    if (coupon.minAmountCents && input.amountCents < coupon.minAmountCents) {
      fail(
        `requiere un monto mínimo de ${toMoney(coupon.minAmountCents)}. Total actual: ${toMoney(input.amountCents)}.`,
      );
    }

    const allowedServices = await this.repo.getServices(coupon.id);
    const hasServiceRestriction = allowedServices.length > 0;
    const inputServiceIds =
      input.serviceIds ?? input.serviceItems?.map((s) => s.serviceId) ?? [];
    let discountBaseAmountCents = input.amountCents;

    if (hasServiceRestriction) {
      if (!inputServiceIds.length) {
        fail(
          'solo aplica a servicios específicos y la reserva no incluye servicios elegibles.',
        );
      }

      const hasValidService = inputServiceIds.some((id) =>
        allowedServices.includes(id),
      );

      if (!hasValidService) {
        fail('no aplica a los servicios seleccionados en esta reserva.');
      }

      if (input.serviceItems?.length) {
        discountBaseAmountCents = input.serviceItems
          .filter((item) => allowedServices.includes(item.serviceId))
          .reduce((acc, item) => acc + Math.max(item.amountCents, 0), 0);

        if (discountBaseAmountCents <= 0) {
          fail('no aplica al monto de los servicios elegibles en la reserva.');
        }
      }
    }

    // =========================
    // CALCULATE DISCOUNT
    // =========================
    let discount = 0;

    if (coupon.type === 'percentage') {
      discount = Math.round((discountBaseAmountCents * coupon.value) / 100);
    } else {
      discount = coupon.value;
    }

    if (coupon.maxDiscountCents) {
      discount = Math.min(discount, coupon.maxDiscountCents);
    }

    // Nunca descontar más del monto elegible
    discount = Math.min(discount, discountBaseAmountCents);

    if (discount <= 0) {
      const maxCapText = coupon.maxDiscountCents
        ? ` Tope de descuento: ${toMoney(coupon.maxDiscountCents)}.`
        : '';
      fail(
        `el descuento calculado es 0. Monto elegible: ${toMoney(discountBaseAmountCents)}.${maxCapText}`,
      );
    }

    return {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type, // "percentage" | "fixed"
        value: coupon.value, // 20 o 500
      },
      discountCents: discount,
      finalAmount: Math.max(input.amountCents - discount, 0),
      discountBaseAmountCents,
    };
  }
}
