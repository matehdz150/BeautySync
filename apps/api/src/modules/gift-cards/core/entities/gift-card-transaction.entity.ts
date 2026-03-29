// core/entities/gift-card-transaction.entity.ts

export type GiftCardTransactionType =
  | 'issue'
  | 'redeem'
  | 'refund'
  | 'adjustment';

export class GiftCardTransaction {
  constructor(
    public readonly id: string,
    public readonly giftCardId: string,
    public readonly type: GiftCardTransactionType,
    public readonly amountCents: number,

    public readonly referenceType: string | null,
    public readonly referenceId: string | null,

    public readonly note: string | null,
    public readonly createdAt: Date,
  ) {}
}
