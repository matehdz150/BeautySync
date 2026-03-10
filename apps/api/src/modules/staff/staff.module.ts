import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

import { StaffController } from './application/staff.controller';

import { STAFF_REPOSITORY } from './core/ports/tokens';

import { StaffDrizzleRepository } from './infrastructure/adapters/staff-drizzle.repository';

import { GetStaffUseCase } from './core/use-cases/get-staff.use-case';
import { GetStaffsUseCase } from './core/use-cases/get-all-staffs.use-case';
import { GetStaffByBranchUseCase } from './core/use-cases/get-staff-by-branch.use-case';
import { FindStaffForServiceUseCase } from './core/use-cases/find-staff-for-service.use-case';

import { CreateStaffUseCase } from './core/use-cases/create-staff.use-case';
import { UpdateStaffUseCase } from './core/use-cases/update-staff.use-case';
import { DeleteStaffUseCase } from './core/use-cases/delete-staff.use-case';

import { InviteStaffUseCase } from './core/use-cases/invite-staff.use-case';
import { ReinviteStaffUseCase } from './core/use-cases/reinvite-staff.use-case';

@Module({
  imports: [AuthModule],

  controllers: [StaffController],

  providers: [
    // repository binding
    {
      provide: STAFF_REPOSITORY,
      useClass: StaffDrizzleRepository,
    },

    // use cases
    GetStaffUseCase,
    GetStaffsUseCase,
    GetStaffByBranchUseCase,
    FindStaffForServiceUseCase,

    CreateStaffUseCase,
    UpdateStaffUseCase,
    DeleteStaffUseCase,

    InviteStaffUseCase,
    ReinviteStaffUseCase,
  ],
})
export class StaffModule {}
