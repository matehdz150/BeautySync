// core/entities/gift-card.entity.ts

export type GiftCardStatus = 'active' | 'redeemed' | 'expired' | 'cancelled';

export class GiftCard {
  constructor(
    public readonly id: string,
    public readonly branchId: string,
    public readonly code: string,

    public readonly initialAmountCents: number,
    public readonly balanceCents: number,

    public readonly currency: string,
    public readonly status: GiftCardStatus,

    public readonly ownerUserId: string | null,

    public readonly expiresAt: Date | null,

    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
