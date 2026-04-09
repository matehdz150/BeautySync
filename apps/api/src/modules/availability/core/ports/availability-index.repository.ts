import { AvailabilityIndexSlot } from '../entities/availability-global-index.entity';

export interface AvailabilityIndexRepository {
  buildIndex(branchId: string, start: Date, end: Date): Promise<void>;
  getRange(
    branchId: string,
    start: Date,
    end: Date,
  ): Promise<AvailabilityIndexSlot[]>;
  getNextAvailable(
    branchId: string,
    fromTimestamp: number,
  ): Promise<AvailabilityIndexSlot | null>;
  invalidate(branchId: string): Promise<void>;
}
