import { Module } from '@nestjs/common';

import { CalendarController } from './application/calendar.controller';

import { GetCalendarDayUseCase } from './core/use-cases/get-calendar-day.use-case';
import { GetCalendarWeekSummaryUseCase } from './core/use-cases/get-calendar-week-summary.use-case';

import {
  CALENDAR_EVENTS_PORT,
  APPOINTMENTS_PORT,
  BRANCH_SETTINGS_PORT,
  CALENDAR_SNAPSHOT_REPOSITORY,
} from './core/ports/tokens';

import { AppointmentsDrizzleAdapter } from './infrastructure/appointments.drizzle.adapter';
import { CalendarEventsDrizzleAdapter } from './infrastructure/calendar-events.drizzle.adapter';
import { BranchSettingsDrizzleAdapter } from './infrastructure/branch-settings.drizzle.adapter';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../cache/cache.module';
import { CalendarSseService } from './calendar-sse.service';
import { CalendarRealtimeBridge } from './calendar.realtime';
import { CalendarRealtimePublisher } from './calendar-realtime.publisher';
import { AvailabilityModule } from '../availability/availability.module';
import { RedisCalendarSnapshotRepository } from './infrastructure/redis-calendar-snapshot.repository';
import { CalendarSnapshotService } from './calendar-snapshot.service';
import { RecomputeCalendarSnapshotUseCase } from './core/use-cases/recompute-calendar-snapshot.use-case';

@Module({
  imports: [AuthModule, CacheModule, AvailabilityModule],
  controllers: [CalendarController],
  providers: [
    GetCalendarDayUseCase,
    GetCalendarWeekSummaryUseCase,
    CalendarSseService,
    CalendarRealtimeBridge,
    CalendarRealtimePublisher,
    RedisCalendarSnapshotRepository,
    CalendarSnapshotService,
    RecomputeCalendarSnapshotUseCase,

    {
      provide: CALENDAR_EVENTS_PORT,
      useClass: CalendarEventsDrizzleAdapter,
    },
    {
      provide: APPOINTMENTS_PORT,
      useClass: AppointmentsDrizzleAdapter,
    },
    {
      provide: BRANCH_SETTINGS_PORT,
      useClass: BranchSettingsDrizzleAdapter,
    },
    {
      provide: CALENDAR_SNAPSHOT_REPOSITORY,
      useExisting: RedisCalendarSnapshotRepository,
    },
  ],
  exports: [CalendarRealtimePublisher, CalendarSnapshotService],
})
export class CalendarModule {}
