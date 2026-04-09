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
import { CacheModule } from '../cache/cache.module';
import { GetStaffWithInvitesUseCase } from './core/use-cases/find-staff-invites-by-branch.use-case';
import { GetInactiveStaffUseCase } from './core/use-cases/get-inactive-staff.use-case';
import { ActivateStaffUseCase } from './core/use-cases/activate-staff.use-case';
import { StaffBranchSnapshotCacheService } from './infrastructure/adapters/staff-branch-snapshot-cache.service';

@Module({
  imports: [AuthModule, CacheModule],

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
    GetStaffWithInvitesUseCase,

    CreateStaffUseCase,
    UpdateStaffUseCase,
    DeleteStaffUseCase,

    InviteStaffUseCase,
    ReinviteStaffUseCase,

    GetInactiveStaffUseCase,
    ActivateStaffUseCase,
    StaffBranchSnapshotCacheService,
  ],
})
export class StaffModule {}
