export interface BenefitBalance {
  userId: string;
  branchId: string;
  pointsBalance: number;
  updatedAt: Date;
}

export interface UserBenefitsWalletItem {
  branch: {
    id: string;
    name: string;
    address: string | null;
    slug: string | null;
    coverUrl: string | null;
  };

  points: number;

  benefits: {
    hasGiftCard: boolean;
    totalGiftCardCents: number;

    bestCoupon: {
      type: 'percentage' | 'fixed';
      value: number;
    } | null;
  };

  tier: {
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
}

export interface BenefitBalanceRepository {
  getByUserAndBranch(input: { userId: string; branchId: string }): Promise<{
    pointsBalance: number;
  }>;

  getAllUserBalances(userId: string): Promise<
    {
      branchId: string;
      pointsBalance: number;
    }[]
  >;

  decrementIfEnough(input: {
    userId: string;
    branchId: string;
    points: number;
  }): Promise<boolean>;
}
