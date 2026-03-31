import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GIFT_CARD_REPOSITORY } from '../ports/tokens';
import { GiftCardRepository } from '../ports/gift-card.repository';

@Injectable()
export class ClaimGiftCardUseCase {
  constructor(
    @Inject(GIFT_CARD_REPOSITORY)
    private readonly repo: GiftCardRepository,
  ) {}

  async execute(input: {
    code: string;
    publicUserId: string; // 🔥 cambio clave
  }) {
    if (!input.code) {
      throw new BadRequestException('Código requerido');
    }

    const giftCard = await this.repo.findByCode(input.code);

    if (!giftCard) {
      throw new NotFoundException('Gift card no encontrada');
    }

    // =========================
    // 🔒 VALIDACIONES
    // =========================

    if (giftCard.status !== 'active') {
      throw new BadRequestException('Gift card no disponible');
    }

    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      throw new BadRequestException('Gift card expirada');
    }

    // =========================
    // 🧠 CLAIM LOGIC
    // =========================

    // 🔁 YA ES TUYA
    if (giftCard.ownerUserId === input.publicUserId) {
      return {
        alreadyOwned: true,
        giftCard,
      };
    }

    // ❌ YA ES DE OTRO
    if (giftCard.ownerUserId && giftCard.ownerUserId !== input.publicUserId) {
      throw new ForbiddenException('Esta gift card ya fue reclamada');
    }

    // ✅ CLAIM
    const updated = await this.repo.update(giftCard.id, {
      ownerUserId: input.publicUserId,
    });

    return {
      claimed: true,
      giftCard: updated,
    };
  }
}
