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

  updateStatus(
    id: string,
    status: 'CONFIRMED' | 'PENDING' | 'FAILED',
  ): Promise<void>;

  updateMetadata(id: string, metadata: Record<string, unknown>): Promise<void>;

  findByIdempotencyKey?(idempotencyKey: string): Promise<{
    id: string;
  } | null>;
}
