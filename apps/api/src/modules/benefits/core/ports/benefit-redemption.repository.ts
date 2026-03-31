export interface BenefitRedemptionRepository {
  create(input: {
    rewardId: string;
    userId: string;
    branchId: string;
    pointsSpent: number;
    status: 'CONFIRMED' | 'PENDING';
    referenceCode: string;
    metadata?: Record<string, unknown>;
  }): Promise<{
    id: string;
  }>;
}
