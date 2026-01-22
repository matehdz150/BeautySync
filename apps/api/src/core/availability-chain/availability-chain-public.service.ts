import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { branches } from 'src/db/schema';
import * as client from 'src/db/client';

import {
  AvailabilityChainCoreService,
  type AvailabilityChainPlan,
} from './availability-chain-core.service';

@Injectable()
export class AvailabilityChainPublicService {
  constructor(
    @Inject('DB') private db: client.DB,
    private readonly core: AvailabilityChainCoreService,
  ) {}

  /**
   * PUBLIC: slug -> branchId + reglas publicPresenceEnabled
   * Output: EXACTAMENTE el mismo que core (plans[])
   */
  async getAvailableTimesChain(params: {
    slug: string;
    date: string; // YYYY-MM-DD
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    chain: { serviceId: string; staffId: string | 'ANY' }[];
  }): Promise<AvailabilityChainPlan[]> {
    const { slug, date, chain } = params;

    if (!slug?.trim()) {
      throw new BadRequestException('slug is required');
    }

    if (!date?.trim()) {
      throw new BadRequestException('date is required');
    }

    if (!chain?.length) {
      throw new BadRequestException('Chain is required');
    }

    // 1) Branch by slug
    const branch = await client.db.query.branches.findFirst({
      where: eq(branches.publicSlug, slug),
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // 2) Must be public
    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    // 3) Delegate to CORE
    return this.core.getAvailableTimesChain({
      branchId: branch.id,
      date,
      chain,
    });
  }
}
