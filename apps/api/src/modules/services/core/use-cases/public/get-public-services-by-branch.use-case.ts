import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { SERVICE_PUBLIC_REPOSITORY } from '../../ports/tokens';
import * as servicePublicRepository from '../../ports/service-public.repository';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import * as cachePort from 'src/modules/cache/core/ports/cache.port';
import { PublicBranchCacheService } from 'src/modules/cache/application/public-branch-cache.service';
import { AvailabilitySnapshotWarmService } from 'src/modules/availability/infrastructure/adapters/availability-snapshot-warm.service';

@Injectable()
export class GetPublicServicesByBranchSlugUseCase {
  constructor(
    @Inject(SERVICE_PUBLIC_REPOSITORY)
    private readonly repo: servicePublicRepository.ServicePublicRepository,

    @Inject(CACHE_PORT)
    private readonly cache: cachePort.CachePort,
    private readonly publicBranchCache: PublicBranchCacheService,
    private readonly availabilityWarm: AvailabilitySnapshotWarmService,
  ) {}

  async execute(slug: string) {
    const branch = await this.publicBranchCache.getBySlug(slug);
    const key = `public:services:branch:${slug}`;

    const cached =
      await this.cache.get<servicePublicRepository.PublicServiceItem[]>(key);

    if (cached) {
      this.scheduleAvailabilityPrewarm(branch.id);
      return cached;
    }

    const services = await this.repo.getServicesByBranchSlug(slug);

    await this.cache.set(key, services, 3600);
    this.scheduleAvailabilityPrewarm(branch.id);

    return services;
  }

  private scheduleAvailabilityPrewarm(branchId: string) {
    setImmediate(() => {
      void this.prewarmAvailability(branchId);
    });
  }

  private async prewarmAvailability(branchId: string) {
    await this.availabilityWarm
      .enqueueRange({
        branchId,
        start: DateTime.now().startOf('day').toISODate() as string,
        end: DateTime.now().startOf('day').plus({ days: 13 }).toISODate() as string,
      })
      .catch((error: unknown) => {
        console.error('[Availability] PREWARM FAILED', branchId, error);
      });
  }
}
