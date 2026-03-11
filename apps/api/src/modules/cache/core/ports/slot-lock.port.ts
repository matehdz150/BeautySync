export interface SlotLockPort {
  acquire(params: {
    branchId: string;
    staffId: string;
    startIso: string;
    ttlSeconds?: number;
    ownerToken: string;
  }): Promise<boolean>;

  release(params: {
    branchId: string;
    staffId: string;
    startIso: string;
    ownerToken: string;
  }): Promise<void>;

  isLocked(params: {
    branchId: string;
    staffId: string;
    startIso: string;
  }): Promise<boolean>;

  getOwner(params: {
    branchId: string;
    staffId: string;
    startIso: string;
  }): Promise<string | null>;

  listLockedStarts(params: {
    branchId: string;
    staffIds: string[];
    date: string;
  }): Promise<Map<string, Set<string>>>;
}
