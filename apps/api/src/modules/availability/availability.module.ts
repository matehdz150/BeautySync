import { Module } from '@nestjs/common';

import { AvailabilityController } from './application/controllers/availability.controller';
import { AvailabilityPublicController } from './application/controllers/availability.public.controller';

import { AvailabilityService } from './infrastructure/adapters/availability.service';
import { AvailabilityPublicService } from './infrastructure/adapters/availability.public.service';

import { AvailabilityCoreService } from './infrastructure/adapters/availability-chain.service';
import { AvailabilityEngine } from './infrastructure/adapters/availability-engine.service';
import { AvailabilityCacheService } from './infrastructure/adapters/availability-cache.service';
import { AvailabilityIndexCacheService } from './infrastructure/adapters/availability-index-cache.service';
import { DrizzleAvailabilityRepository } from './infrastructure/adapters/drizzle-availability.repository';
import { DrizzleAvailabilityPublicRepository } from './infrastructure/adapters/drizzle-public-availability.repository';

import {
  AVAILABILITY_REPOSITORY,
  AVAILABILITY_PUBLIC_REPOSITORY,
  AVAILABILITY_CHAIN_REPOSITORY,
  AVAILABILITY_GENERATOR_SERVICE,
  AVAILABILITY_INDEX_REPOSITORY,
  AVAILABILITY_SERVICES_REPOSITORY,
  AVAILABILITY_SNAPSHOT_REPOSITORY,
} from './core/ports/tokens';

// internal use cases
import { GetAvailabilityUseCase } from './core/use-cases/get-availability.use-case';
import { GetAvailableServicesForSlotUseCase } from './core/use-cases/get-available-services-for-slot.use-case';
import { GetAvailableServicesAtUseCase } from './core/use-cases/get-available-services-at.use-case';
import { GetAvailableTimesChainUseCase } from './core/use-cases/get-available-times-chain.use-case';
import { BuildAvailabilitySnapshotUseCase } from './core/use-cases/build-availability-snapshot.use-case';
import { ComputeAvailableDatesUseCase } from './core/use-cases/compute-available-dates.use-case';
import { ComputeSlotsForDayUseCase } from './core/use-cases/compute-slots-for-day.use-case';
import { BuildAvailabilityIndexUseCase } from './core/use-cases/build-availability-index.use-case';
import { GetAvailableDatesFromIndexUseCase } from './core/use-cases/get-available-dates-from-index.use-case';
import { GetSlotsForDayFromIndexUseCase } from './core/use-cases/get-slots-for-day-from-index.use-case';
import { GetAvailabilityAtUseCase } from './core/use-cases/get-availability-at.use-case';
import { GetAvailableServicesForSlotFromSnapshotUseCase } from './core/use-cases/get-available-services-for-slot-from-snapshot.use-case';

// public use cases
import { GetPublicAvailableDatesUseCase } from './core/use-cases/public/get-public-available-days.use-case';
import { GetPublicAvailableTimesUseCase } from './core/use-cases/public/get-public-available-times.use-case';
import { GetPublicAvailableTimesChainUseCase } from './core/use-cases/public/get-public-available-times-chain.use-case';
import { CacheModule } from '../cache/cache.module';
import { LockSlotUseCase } from './core/use-cases/lock-slot.use-case';
import { UnlockSlotUseCase } from './core/use-cases/unlock-slot.use-case';
import { RedisAvailabilitySnapshotRepository } from './infrastructure/adapters/redis-availability-snapshot.repository';
import { AvailabilitySnapshotGeneratorService } from './infrastructure/adapters/availability-generator.service';
import { AvailabilitySnapshotWarmService } from './infrastructure/adapters/availability-snapshot-warm.service';
import { RedisAvailabilityIndexRepository } from './infrastructure/adapters/redis-availability-index.repository';
import { RedisAvailabilityServicesRepository } from './infrastructure/adapters/redis-availability-services.repository';
import { AvailabilityServicesLookupService } from './infrastructure/adapters/availability-services-lookup.service';
import { AvailabilitySnapshotService } from './infrastructure/adapters/availability-snapshot.service';

@Module({
  imports: [CacheModule],
  controllers: [AvailabilityController, AvailabilityPublicController],

  providers: [
    // base services
    AvailabilityService,
    AvailabilityPublicService,
    AvailabilityCoreService,
    AvailabilityEngine,
    AvailabilityCacheService,
    AvailabilityIndexCacheService,
    RedisAvailabilitySnapshotRepository,
    RedisAvailabilityIndexRepository,
    RedisAvailabilityServicesRepository,
    AvailabilitySnapshotGeneratorService,
    AvailabilitySnapshotWarmService,
    AvailabilityServicesLookupService,
    AvailabilitySnapshotService,

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
      provide: AVAILABILITY_SNAPSHOT_REPOSITORY,
      useExisting: RedisAvailabilitySnapshotRepository,
    },
    {
      provide: AVAILABILITY_INDEX_REPOSITORY,
      useExisting: RedisAvailabilityIndexRepository,
    },
    {
      provide: AVAILABILITY_SERVICES_REPOSITORY,
      useExisting: RedisAvailabilityServicesRepository,
    },
    {
      provide: AVAILABILITY_GENERATOR_SERVICE,
      useExisting: AvailabilitySnapshotGeneratorService,
    },
    {
      provide: AVAILABILITY_CHAIN_REPOSITORY,
      useClass: DrizzleAvailabilityRepository,
    },

    // internal use cases
    GetAvailabilityUseCase,
    GetAvailableServicesForSlotUseCase,
    GetAvailableServicesForSlotFromSnapshotUseCase,
    GetAvailableServicesAtUseCase,
    GetAvailableTimesChainUseCase,
    BuildAvailabilitySnapshotUseCase,
    ComputeAvailableDatesUseCase,
    ComputeSlotsForDayUseCase,
    BuildAvailabilityIndexUseCase,
    GetAvailableDatesFromIndexUseCase,
    GetSlotsForDayFromIndexUseCase,
    GetAvailabilityAtUseCase,
    LockSlotUseCase,
    UnlockSlotUseCase,

    // public use cases
    GetPublicAvailableDatesUseCase,
    GetPublicAvailableTimesUseCase,
    GetPublicAvailableTimesChainUseCase,
  ],
  exports: [
    AvailabilityService,
    AvailabilityCacheService,
    AvailabilityIndexCacheService,
    AvailabilitySnapshotWarmService,
    AvailabilitySnapshotService,
    {
      provide: AVAILABILITY_SNAPSHOT_REPOSITORY,
      useExisting: RedisAvailabilitySnapshotRepository,
    },
    {
      provide: AVAILABILITY_INDEX_REPOSITORY,
      useExisting: RedisAvailabilityIndexRepository,
    },
    {
      provide: AVAILABILITY_SERVICES_REPOSITORY,
      useExisting: RedisAvailabilityServicesRepository,
    },
    {
      provide: AVAILABILITY_REPOSITORY,
      useExisting: DrizzleAvailabilityRepository,
    },
  ],
})
export class AvailabilityModule {}
