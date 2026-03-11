import { Module } from '@nestjs/common';

import { AvailabilityController } from './application/controllers/availability.controller';
import { AvailabilityPublicController } from './application/controllers/availability.public.controller';

import { AvailabilityService } from './infrastructure/adapters/availability.service';
import { AvailabilityPublicService } from './infrastructure/adapters/availability.public.service';

import { AvailabilityCoreService } from './infrastructure/adapters/availability-chain.service';
import { DrizzleAvailabilityRepository } from './infrastructure/adapters/drizzle-availability.repository';
import { DrizzleAvailabilityPublicRepository } from './infrastructure/adapters/drizzle-public-availability.repository';

import {
  AVAILABILITY_REPOSITORY,
  AVAILABILITY_PUBLIC_REPOSITORY,
  AVAILABILITY_CHAIN_REPOSITORY,
} from './core/ports/tokens';

// internal use cases
import { GetAvailabilityUseCase } from './core/use-cases/get-availability.use-case';
import { GetAvailableServicesForSlotUseCase } from './core/use-cases/get-available-services-for-slot.use-case';
import { GetAvailableServicesAtUseCase } from './core/use-cases/get-available-services-at.use-case';
import { GetAvailableTimesChainUseCase } from './core/use-cases/get-available-times-chain.use-case';

// public use cases
import { GetPublicAvailableDatesUseCase } from './core/use-cases/public/get-public-available-days.use-case';
import { GetPublicAvailableTimesUseCase } from './core/use-cases/public/get-public-available-times.use-case';
import { GetPublicAvailableTimesChainUseCase } from './core/use-cases/public/get-public-available-times-chain.use-case';

@Module({
  controllers: [AvailabilityController, AvailabilityPublicController],

  providers: [
    // base services
    AvailabilityService,
    AvailabilityPublicService,
    AvailabilityCoreService,

    // repositories
    DrizzleAvailabilityRepository,
    DrizzleAvailabilityPublicRepository,

    {
      provide: AVAILABILITY_REPOSITORY,
      useExisting: DrizzleAvailabilityRepository,
    },

    {
      provide: AVAILABILITY_PUBLIC_REPOSITORY,
      useExisting: DrizzleAvailabilityPublicRepository,
    },
    {
      provide: AVAILABILITY_CHAIN_REPOSITORY,
      useClass: DrizzleAvailabilityRepository,
    },

    // internal use cases
    GetAvailabilityUseCase,
    GetAvailableServicesForSlotUseCase,
    GetAvailableServicesAtUseCase,
    GetAvailableTimesChainUseCase,

    // public use cases
    GetPublicAvailableDatesUseCase,
    GetPublicAvailableTimesUseCase,
    GetPublicAvailableTimesChainUseCase,
  ],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
