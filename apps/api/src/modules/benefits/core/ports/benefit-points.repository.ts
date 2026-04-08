// core/ports/benefit-points.repository.ts

export interface BenefitPointsRepository {
  addPoints(params: {
    userId: string;
    branchId: string;
    points: number;
    source: string;
    referenceId?: string;
    idempotencyKey: string;
    metadata?: Record<string, unknown>;
    updateBalanceCache?: boolean;
  }): Promise<boolean>;

  getTierPoints(params: { userId: string; branchId: string }): Promise<number>;
}
