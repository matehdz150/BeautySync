import { Module } from '@nestjs/common';

import { CalendarController } from './application/calendar.controller';

import { GetCalendarDayUseCase } from './core/use-cases/get-calendar-day.use-case';
import { GetCalendarWeekSummaryUseCase } from './core/use-cases/get-calendar-week-summary.use-case';

import {
  CALENDAR_EVENTS_PORT,
  APPOINTMENTS_PORT,
  BRANCH_SETTINGS_PORT,
} from './core/ports/tokens';

import { AppointmentsDrizzleAdapter } from './infrastructure/appointments.drizzle.adapter';
import { CalendarEventsDrizzleAdapter } from './infrastructure/calendar-events.drizzle.adapter';
import { BranchSettingsDrizzleAdapter } from './infrastructure/branch-settings.drizzle.adapter';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../cache/cache.module';
import { CalendarSseService } from './calendar-sse.service';
import { CalendarRealtimeBridge } from './calendar.realtime';
import { CalendarRealtimePublisher } from './calendar-realtime.publisher';

@Module({
  imports: [AuthModule, CacheModule],
  controllers: [CalendarController],
  providers: [
    GetCalendarDayUseCase,
    GetCalendarWeekSummaryUseCase,
    CalendarSseService,
    CalendarRealtimeBridge,
    CalendarRealtimePublisher,

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
  ],
  exports: [CalendarRealtimePublisher],
})
export class CalendarModule {}
