import { AvailabilityResult } from '../entities/availability.entity';

export interface AvailabilityRepository {
  getAvailability(params: {
    branchId: string;
    serviceId?: string;
    requiredDurationMin?: number;
    date: string;
    staffId?: string;
  }): Promise<AvailabilityResult>;

  getAvailableServicesForSlot(params: {
    branchId: string;
    staffId: string;
    datetime: string;
  }): Promise<any[]>;

  getAvailableServicesAt(params: {
    branchId: string;
    datetime: string;
  }): Promise<any[]>;
}
