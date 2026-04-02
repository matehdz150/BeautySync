export interface TierRewardGrantRepository {
  exists(input: {
    userId: string;
    branchId: string;
    tierRewardId: string;
  }): Promise<boolean>;

  create(input: {
    userId: string;
    branchId: string;
    tierRewardId: string;
  }): Promise<void>;
}
