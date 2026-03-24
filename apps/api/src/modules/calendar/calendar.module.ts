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

@Module({
  controllers: [CalendarController],
  providers: [
    GetCalendarDayUseCase,

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
})
export class CalendarModule {}
