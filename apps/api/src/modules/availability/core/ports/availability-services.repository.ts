import { AvailabilityServicesSnapshot } from '../entities/availability-services-snapshot.entity';

export interface AvailabilityServicesRepository {
  get(
    branchId: string,
    date: string,
  ): Promise<AvailabilityServicesSnapshot | null>;
  set(snapshot: AvailabilityServicesSnapshot): Promise<void>;
  buildFromSnapshot(
    branchId: string,
    date: string,
  ): Promise<AvailabilityServicesSnapshot | null>;
  invalidate(branchId: string, date?: string): Promise<void>;
}
