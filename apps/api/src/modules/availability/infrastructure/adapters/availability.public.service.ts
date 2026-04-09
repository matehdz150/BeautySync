import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PublicBranchCacheService } from 'src/modules/cache/application/public-branch-cache.service';

import { AvailabilityService } from './availability.service';
import { AvailabilityCoreService } from './availability-chain.service';

@Injectable()
export class AvailabilityPublicService {
  constructor(
    private availabilityService: AvailabilityService,
    private core: AvailabilityCoreService,
    private readonly publicBranchCache: PublicBranchCacheService,
  ) {}

  async getAvailableDates({
    slug,
    requiredDurationMin,
    staffId,
    month,
  }: {
    slug: string;
    requiredDurationMin: number;
    staffId?: string;
    month?: string; // YYYY-MM
  }): Promise<{ date: string; available: boolean }[]> {
    // 1️⃣ Branch
    const branch = await this.publicBranchCache.getCachedBySlug(slug);

    if (!branch) {
      return [];
    }

    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    return this.availabilityService.getAvailableDates({
      branchId: branch.id,
      requiredDurationMin,
      staffId,
      month,
    });
  }

  async getAvailableTimes({
    slug,
    serviceId,
    requiredDurationMin,
    date,
    staffId,
  }: {
    slug: string;
    serviceId?: string;
    requiredDurationMin?: number;
    date: string;
    staffId?: string;
  }) {
    // 1️⃣ Branch
    const branch = await this.publicBranchCache.getBySlug(slug);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    return this.core.getAvailableTimes({
      branchId: branch.id,
      serviceId,
      requiredDurationMin,
      date,
      staffId,
    });
  }

  async getAvailableTimesChain({
    slug,
    date,
    chain,
  }: {
    slug: string;
    date: string;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    chain: { serviceId: string; staffId: string | 'ANY' }[];
  }) {
    if (!chain.length) {
      throw new BadRequestException('Chain is required');
    }

    // 1️⃣ Branch
    const branch = await this.publicBranchCache.getBySlug(slug);

    if (!branch) throw new NotFoundException('Branch not found');
    if (!branch.publicPresenceEnabled)
      throw new ForbiddenException('Branch is not public');

    return this.core.getAvailableTimesChain({
      branchId: branch.id,
      date,
      chain,
    });
  }
}
