// redeem-gift-card.use-case.ts

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { GIFT_CARD_REPOSITORY } from '../ports/tokens';
import * as repo from '../ports/gift-card.repository';
import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

@Injectable()
export class RedeemGiftCardUseCase {
  constructor(
    @Inject(GIFT_CARD_REPOSITORY)
    private readonly repo: repo.GiftCardRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(input: {
    code: string;
    amountCents: number;
    branchId: string;
    publicUserId: string;
  }) {
    // =========================
    // VALIDATIONS
    // =========================
    if (!input.code) {
      throw new BadRequestException('Code is required');
    }

    if (!input.amountCents || input.amountCents <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    if (!input.branchId) {
      throw new BadRequestException('branchId requerido');
    }

    // =========================
    // 🔥 ACCESS CONTROL
    // =========================
    const branch = await this.branchesRepo.findById(input.branchId);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // =========================
    // 🔥 BUSINESS VALIDATION
    // =========================
    const giftCard = await this.repo.findByCode(input.code);

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    if (giftCard.branchId !== input.branchId) {
      throw new ForbiddenException(
        'Esta gift card no pertenece a esta sucursal',
      );
    }

    // 🔥 OWNER VALIDATION
    if (giftCard.ownerUserId !== input.publicUserId) {
      throw new ForbiddenException('No puedes usar esta gift card');
    }

    if (giftCard.status !== 'active') {
      throw new BadRequestException('Gift card no está activa');
    }

    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      throw new BadRequestException('Gift card expirada');
    }

    if (giftCard.balanceCents < input.amountCents) {
      throw new BadRequestException('Saldo insuficiente');
    }

    // =========================
    // 🔥 EXECUTE (repo hace transaction)
    // =========================
    return this.repo.redeem(input);
  }
}
