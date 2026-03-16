import { Module } from '@nestjs/common';

import { StaffTimeOffController } from './application/staff-time-off.controller';

// use cases - time off
import { CreateStaffTimeOffUseCase } from './core/use-cases/create-staff-timeoff.use-case';
import { CreateRecurringTimeOffUseCase } from './core/use-cases/create-recurring-timeoff.use-case';
import { UpdateStaffTimeOffUseCase } from './core/use-cases/update-staff-timeoff.use-case';
import { DeleteStaffTimeOffUseCase } from './core/use-cases/delete-staff-timeoff.usecase';
import { GetStaffTimeOffUseCase } from './core/use-cases/get-staff-timeoff.use-case';
import { GetBranchTimeOffUseCase } from './core/use-cases/get-branch-timeoff.use-case';

// use cases - rules
import { CreateStaffTimeOffRuleUseCase } from './core/use-cases/create-staff-timeoff-rule.use-case';
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

@Module({
  controllers: [StaffTimeOffController],

  providers: [
    // timeoff usecases
    CreateStaffTimeOffUseCase,
    CreateRecurringTimeOffUseCase,
    UpdateStaffTimeOffUseCase,
    DeleteStaffTimeOffUseCase,
    GetStaffTimeOffUseCase,
    GetBranchTimeOffUseCase,

    // rules usecases
    CreateStaffTimeOffRuleUseCase,
    UpdateStaffTimeOffRuleUseCase,
    DeleteStaffTimeOffRuleUseCase,

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
