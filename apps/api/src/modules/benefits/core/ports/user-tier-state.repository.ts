export interface UserTierState {
  userId: string;
  branchId: string;
  currentTierId: string | null;
}

export interface UserTierStateRepository {
  getByUser(userId: string): Promise<UserTierState[]>;
}
