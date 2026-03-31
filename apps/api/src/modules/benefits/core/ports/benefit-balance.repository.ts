export interface BenefitBalanceRepository {
  getByUserAndBranch(input: { userId: string; branchId: string }): Promise<{
    pointsBalance: number;
  }>;

  decrementIfEnough(input: {
    userId: string;
    branchId: string;
    points: number;
  }): Promise<boolean>;
}
