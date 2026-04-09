import { AvailabilityDaySnapshot } from '../entities/availability-day-snapshot.entity';

export interface AvailabilityGeneratorService {
  generateForDay(branchId: string, date: string): Promise<AvailabilityDaySnapshot>;
  generateForRange(
    branchId: string,
    start: string,
    end: string,
  ): Promise<AvailabilityDaySnapshot[]>;
}
