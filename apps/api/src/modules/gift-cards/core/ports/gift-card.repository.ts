// core/ports/gift-card.repository.ts

import { GiftCard } from '../entities/gift-card.entity';
import { GiftCardTransaction } from '../entities/gift-card-transaction.entity';

export interface CreateGiftCardInput {
  branchId: string;
  code: string;
  initialAmountCents: number;
  currency?: string;
  expiresAt?: Date | null;
  ownerUserId?: string | null;
}

export interface GiftCardRepository {
  // 🔥 gift cards
  create(data: CreateGiftCardInput): Promise<GiftCard>;

  findById(id: string): Promise<GiftCard | null>;

  findByCode(code: string): Promise<GiftCard | null>;

  findByBranch(branchId: string): Promise<GiftCard[]>;

  findByUser(userId: string): Promise<GiftCard[]>;

  updateBalance(
    id: string,
    newBalanceCents: number,
    status?: GiftCard['status'],
  ): Promise<void>;

  // 🔥 transactions
  createTransaction(data: {
    giftCardId: string;
    type: GiftCardTransaction['type'];
    amountCents: number;
    referenceType?: string;
    referenceId?: string;
    note?: string;
  }): Promise<GiftCardTransaction>;

  findTransactions(giftCardId: string): Promise<GiftCardTransaction[]>;

  redeem(input: {
    code: string;
    amountCents: number;
    branchId: string;
  }): Promise<{
    remainingBalance: number;
  }>;

  update(id: string, data: Partial<GiftCard>): Promise<GiftCard>;
}
