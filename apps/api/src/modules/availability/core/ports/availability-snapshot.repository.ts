import { AvailabilityDaySnapshot } from '../entities/availability-day-snapshot.entity';

export interface AvailabilitySnapshotRepository {
  get(branchId: string, date: string): Promise<AvailabilityDaySnapshot | null>;
  set(snapshot: AvailabilityDaySnapshot): Promise<void>;
  invalidate(branchId: string, date?: string): Promise<void>;
}
