import { CalendarDaySnapshot } from '../entities/calendar-day-snapshot.entity';

export interface CalendarSnapshotRepository {
  get(params: {
    branchId: string;
    date: string;
  }): Promise<CalendarDaySnapshot | null>;
  set(snapshot: CalendarDaySnapshot): Promise<void>;
  invalidate(params: { branchId: string; date?: string }): Promise<void>;
}
