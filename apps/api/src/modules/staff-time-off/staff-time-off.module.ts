import { Module } from '@nestjs/common';

import { StaffTimeOffController } from './application/staff-time-off.controller';

// use cases - time off
import { CreateStaffTimeOffUseCase } from './core/use-cases/create-staff-timeoff.use-case';
import { UpdateStaffTimeOffUseCase } from './core/use-cases/update-staff-timeoff.use-case';
import { DeleteStaffTimeOffUseCase } from './core/use-cases/delete-staff-timeoff.usecase';
import { GetStaffTimeOffUseCase } from './core/use-cases/get-staff-timeoff.use-case';
import { GetBranchTimeOffUseCase } from './core/use-cases/get-branch-timeoff.use-case';

// use cases - rules
import { UpdateStaffTimeOffRuleUseCase } from './core/use-cases/update-staff-timeoff-rule.use-case';
import { DeleteStaffTimeOffRuleUseCase } from './core/use-cases/delete-staff-timeoff-rule.use-case';

// repositories
import { DrizzleStaffTimeOffRepository } from './infrastructure/drizzle-staff-timeoff.repository';
import { DrizzleStaffTimeOffRulesRepository } from './infrastructure/drizzle-staff-timeoff-rules.repository';

// tokens
import {
  STAFF_TIMEOFF_REPOSITORY,
  STAFF_TIMEOFF_RULES_REPOSITORY,
} from './core/ports/tokens';
import { GetStaffTimeOffDetailUseCase } from './core/use-cases/get-staff-timeoff-details.use-case';
import { GetAvailableTimeOffStartSlotsUseCase } from './core/use-cases/availability/get-available-timeoff-slots.use-case';
import { GetAvailableTimeOffEndSlotsUseCase } from './core/use-cases/availability/get-available-timeoff-end.use-case';
import { AvailabilityModule } from '../availability/availability.module';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
  controllers: [StaffTimeOffController],
  imports: [AvailabilityModule, CalendarModule],

  providers: [
    // timeoff usecases
    CreateStaffTimeOffUseCase,
    UpdateStaffTimeOffUseCase,
    DeleteStaffTimeOffUseCase,
    GetStaffTimeOffUseCase,
    GetBranchTimeOffUseCase,

    // rules usecases
    UpdateStaffTimeOffRuleUseCase,
    DeleteStaffTimeOffRuleUseCase,

    GetStaffTimeOffDetailUseCase,
    GetAvailableTimeOffStartSlotsUseCase,
    GetAvailableTimeOffEndSlotsUseCase,

    // repositories
    {
      provide: STAFF_TIMEOFF_REPOSITORY,
      useClass: DrizzleStaffTimeOffRepository,
    },

    {
      provide: STAFF_TIMEOFF_RULES_REPOSITORY,
      useClass: DrizzleStaffTimeOffRulesRepository,
    },
  ],

  exports: [],
})
export class StaffTimeOffModule {}
