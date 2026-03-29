import { Module } from '@nestjs/common';

/* =========================
   CONTROLLER
========================= */
import { GiftCardsController } from './application/gift-cards.controller';

/* =========================
   USE CASES
========================= */
import { CreateGiftCardUseCase } from './core/use-cases/create-gift-card.use-case';
import { RedeemGiftCardUseCase } from './core/use-cases/redeem-gift-card.use-case';

import { GetGiftCardUseCase } from './core/use-cases/get-gift-card.use-case';
import { GetGiftCardsByBranchUseCase } from './core/use-cases/get-gift-cards-by-branch.use-case';
import { GetMyGiftCardsUseCase } from './core/use-cases/get-my-gift-cards.use-case';
import { GetUserGiftCardsUseCase } from './core/use-cases/get-gift-cards-by-user.use-case';

import { GetGiftCardTransactionsUseCase } from './core/use-cases/get-gift-card-transactions.use-case';

import { AssignGiftCardToUserUseCase } from './core/use-cases/assign-gift-card-to-user.use-case';
import { UnassignGiftCardFromUserUseCase } from './core/use-cases/unassign-gift-card-user.use-case';

/* =========================
   REPOSITORY (DRIZZLE)
========================= */
import { DrizzleGiftCardRepository } from './infrastructure/adapters/drizzle-gift-card.repository';

/* =========================
   TOKENS
========================= */
import { GIFT_CARD_REPOSITORY } from './core/ports/tokens';

/* =========================
   DEPENDENCIES
========================= */
import { BranchesModule } from '../branches/branches.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    BranchesModule, // 🔥 access control (org validation)
    AuthModule, // 🔥 guards / user contex
  ],

  controllers: [GiftCardsController],

  providers: [
    /* =========================
       USE CASES
    ========================= */
    CreateGiftCardUseCase,
    RedeemGiftCardUseCase,

    GetGiftCardUseCase,
    GetGiftCardsByBranchUseCase,
    GetMyGiftCardsUseCase,
    GetUserGiftCardsUseCase,

    GetGiftCardTransactionsUseCase,

    AssignGiftCardToUserUseCase,
    UnassignGiftCardFromUserUseCase,

    /* =========================
       REPOSITORY
    ========================= */
    {
      provide: GIFT_CARD_REPOSITORY,
      useClass: DrizzleGiftCardRepository,
    },
  ],

  exports: [
    // 🔥 útil para booking module después
    RedeemGiftCardUseCase,
    GetMyGiftCardsUseCase,
  ],
})
export class GiftCardsModule {}
