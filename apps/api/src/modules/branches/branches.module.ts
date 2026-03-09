import { Module } from '@nestjs/common';

/* CONTROLLERS */

import { BranchesController } from './application/controllers/branches.controller';
import { BranchImagesController } from './application/controllers/branch-images.controller';
import { BranchSettingsController } from './application/controllers/branch-settings.controller';

/* USE CASES */

import { CreateBranchUseCase } from './core/use-cases/manager/create-branch.use-case';
import { FindAllBranchesUseCase } from './core/use-cases/manager/find-all-branches.use-case';
import { FindBranchesByOrgUseCase } from './core/use-cases/manager/find-branches-by-org.use-case';
import { GetBranchBasicUseCase } from './core/use-cases/manager/get-basic-branch.use-case';
import { UpdateBranchUseCase } from './core/use-cases/manager/update-branch.use-case';
import { UpdateBranchLocationUseCase } from './core/use-cases/manager/update-branch-location.use-case';
import { FindBranchByUserUseCase } from './core/use-cases/manager/find-branch-by-user.use-case';
import { GetBranchForAiUseCase } from './core/use-cases/manager/get-branch-for-ai.use-case';

/* BRANCH SETTINGS */

import { GetBranchSettingsUseCase } from './core/use-cases/manager/get-branch-settings.use-case';
import { UpdateBranchSettingsUseCase } from './core/use-cases/manager/update-branch-settings.use-case';

/* BRANCH IMAGES */

import { GetBranchImagesUseCase } from './core/use-cases/manager/get-branch-images.use-case';
import { AddBranchImageUseCase } from './core/use-cases/manager/add-branch-image.use-case';
import { UpdateBranchImageUseCase } from './core/use-cases/manager/update-branch-image.use-case';
import { DeleteBranchImageUseCase } from './core/use-cases/manager/delete-branch-image.use-case';

/* REPOSITORIES */

import { BranchesDrizzleRepository } from './infrastructure/adapters/branches-drizzle.repository';
import { BranchSettingsDrizzleRepository } from './infrastructure/adapters/branch-settings-drizzle.repository';
import { BranchImagesDrizzleRepository } from './infrastructure/adapters/branch-images-drizzle.repository';

/* TOKENS */

import {
  BRANCHES_REPOSITORY,
  BRANCH_SETTINGS_REPOSITORY,
  BRANCH_IMAGES_REPOSITORY,
} from './core/ports/tokens';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    BranchesController,
    BranchImagesController,
    BranchSettingsController,
  ],

  providers: [
    /* BRANCHES USE CASES */

    CreateBranchUseCase,
    FindAllBranchesUseCase,
    GetBranchBasicUseCase,
    UpdateBranchUseCase,
    UpdateBranchLocationUseCase,
    FindBranchByUserUseCase,
    FindBranchesByOrgUseCase,

    /* BRANCH SETTINGS USE CASES */

    GetBranchSettingsUseCase,
    UpdateBranchSettingsUseCase,

    /* BRANCH IMAGES USE CASES */

    GetBranchImagesUseCase,
    AddBranchImageUseCase,
    UpdateBranchImageUseCase,
    DeleteBranchImageUseCase,
    GetBranchForAiUseCase,

    /* REPOSITORY ADAPTERS */

    {
      provide: BRANCHES_REPOSITORY,
      useClass: BranchesDrizzleRepository,
    },

    {
      provide: BRANCH_SETTINGS_REPOSITORY,
      useClass: BranchSettingsDrizzleRepository,
    },

    {
      provide: BRANCH_IMAGES_REPOSITORY,
      useClass: BranchImagesDrizzleRepository,
    },
  ],
  exports: [GetBranchForAiUseCase],
})
export class BranchesModule {}
