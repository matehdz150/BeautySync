export interface SlotLockPort {
  acquireRange(params: {
    branchId: string;
    staffId: string;
    startIso: string;
    endIso: string;
    ownerToken: string;
    ttlSeconds?: number;
    stepMin?: number;
  }): Promise<boolean>;

  releaseRange(params: {
    branchId: string;
    staffId: string;
    startIso: string;
    endIso: string;
    ownerToken: string;
    stepMin?: number;
  }): Promise<void>;

  isRangeLocked(params: {
    branchId: string;
    staffId: string;
    startIso: string;
    endIso: string;
    stepMin?: number;
  }): Promise<boolean>;

  getRangeOwners(params: {
    branchId: string;
    staffId: string;
    startIso: string;
    endIso: string;
    stepMin?: number;
  }): Promise<string[]>;

  listLockedStarts(params: {
    branchId: string;
    staffIds: string[];
    date: string;
  }): Promise<Map<string, Set<string>>>;
}
