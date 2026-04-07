import { Module } from '@nestjs/common';

import { CacheModule } from '../cache/cache.module';

/* CONTROLLERS */

import { ServicesController } from './application/controllers/services.controller';
import { ServicesPublicController } from './application/controllers/services.public.controller';

/* USE CASES */

import { GetServicesByBranchUseCase } from './core/use-cases/get-services-by-branch.usecase';
import { GetServiceUseCase } from './core/use-cases/get-service.use-case';
import { CreateServiceUseCase } from './core/use-cases/create-service.use-case';
import { UpdateServiceUseCase } from './core/use-cases/update-service.use-case';
import { RemoveServiceUseCase } from './core/use-cases/remove-service.use-case';

import { AssignServiceToStaffUseCase } from './core/use-cases/assign-service-to-staff.use-case';
import { UnassignServiceFromStaffUseCase } from './core/use-cases/unassign-service-to-staff.use-case';

import { GetServicesWithStaffUseCase } from './core/use-cases/get-services-with-staff.use-case';

import { GetServiceNotesUseCase } from './core/use-cases/get-notes.use-case';
import { AddServiceNoteUseCase } from './core/use-cases/add-note.use-case';
import { RemoveServiceNoteUseCase } from './core/use-cases/remove-note.use-case';

import { GetServiceRulesUseCase } from './core/use-cases/get-rules.use-case';
import { AddServiceRuleUseCase } from './core/use-cases/add-rule.use-case';
import { RemoveServiceRuleUseCase } from './core/use-cases/remove-rule.use-case';

/* PUBLIC */

import { GetPublicServicesByBranchSlugUseCase } from './core/use-cases/public/get-public-services-by-branch.use-case';
import { GetStaffForServicePublicUseCase } from './core/use-cases/public/get-staff-for-service-public.use-case';

/* REPOSITORIES */

import { ServicesDrizzleRepository } from './infrastructure/adapters/services-drizzle.repository';
import { ServicesPublicDrizzleRepository } from '../staff/infrastructure/adapters/services-public-drizzle.repository';

/* TOKENS */

import {
  SERVICE_REPOSITORY,
  SERVICE_PUBLIC_REPOSITORY,
} from './core/ports/tokens';
import { GetServiceCategoriesUseCase } from './core/use-cases/public/get-all-categories.use-case';

@Module({
  imports: [
    CacheModule, // 🔥 necesario para cache
  ],

  controllers: [ServicesController, ServicesPublicController],

  providers: [
    /* =========================
       USE CASES
    ========================= */

    GetServicesByBranchUseCase,
    GetServiceUseCase,
    CreateServiceUseCase,
    UpdateServiceUseCase,
    RemoveServiceUseCase,

    AssignServiceToStaffUseCase,
    UnassignServiceFromStaffUseCase,

    GetServicesWithStaffUseCase,

    GetServiceNotesUseCase,
    AddServiceNoteUseCase,
    RemoveServiceNoteUseCase,

    GetServiceRulesUseCase,
    AddServiceRuleUseCase,
    RemoveServiceRuleUseCase,

    /* PUBLIC */

    GetPublicServicesByBranchSlugUseCase,
    GetStaffForServicePublicUseCase,
    GetServiceCategoriesUseCase,

    /* =========================
       REPOSITORIES
    ========================= */

    {
      provide: SERVICE_REPOSITORY,
      useClass: ServicesDrizzleRepository,
    },

    {
      provide: SERVICE_PUBLIC_REPOSITORY,
      useClass: ServicesPublicDrizzleRepository,
    },
  ],
  exports: [SERVICE_REPOSITORY],
})
export class ServicesModule {}
