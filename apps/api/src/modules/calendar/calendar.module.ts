import { Module } from '@nestjs/common';

import { CalendarController } from './application/calendar.controller';

import { GetCalendarDayUseCase } from './core/use-cases/get-calendar-day.use-case';

import {
  APPOINTMENTS_PORT,
  TIMEOFF_PORT,
  BRANCH_SETTINGS_PORT,
} from './core/ports/tokens';

import { AppointmentsDrizzleAdapter } from './infrastructure/appointments.drizzle.adapter';
import { TimeOffDrizzleAdapter } from './infrastructure/timeoff.drizzle.adapter';
import { BranchSettingsDrizzleAdapter } from './infrastructure/branch-settings.drizzle.adapter';
import { AuthModule } from '../auth/auth.module';
import { CalendarSseService } from './calendar-sse.service';
import { CalendarRealtimeBridge } from './calendar.realtime';
import { CalendarRealtimePublisher } from './calendar-realtime.publisher';

@Module({
  imports: [AuthModule],
  controllers: [CalendarController],
  providers: [
    GetCalendarDayUseCase,
    CalendarSseService,
    CalendarRealtimeBridge,
    CalendarRealtimePublisher,

    {
      provide: APPOINTMENTS_PORT,
      useClass: AppointmentsDrizzleAdapter,
    },
    {
      provide: TIMEOFF_PORT,
      useClass: TimeOffDrizzleAdapter,
    },
    {
      provide: BRANCH_SETTINGS_PORT,
      useClass: BranchSettingsDrizzleAdapter,
    },
  ],
  exports: [CalendarRealtimePublisher],
})
export class CalendarModule {}
