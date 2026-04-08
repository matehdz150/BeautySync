import { CalendarEvent } from '../entities/calendar-event.entity';

export interface CalendarEventsPort {
  findByBranchAndRange(params: {
    branchId: string;
    start: Date;
    end: Date;
    staffId?: string;
  }): Promise<CalendarEvent[]>;
}
