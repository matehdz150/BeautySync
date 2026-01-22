import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';

import * as client from 'src/db/client';
import { branches } from 'src/db/schema';

import {
  AvailabilityChainCoreService,
  type AvailabilityChainPlan,
} from './availability-chain-core.service';

@Injectable()
export class AvailabilityChainManagerService {
  constructor(
    @Inject('DB') private db: client.DB,
    private readonly core: AvailabilityChainCoreService,
  ) {}

  async getAvailableTimesChain(params: {
    branchId: string;
    date: string; // YYYY-MM-DD
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    chain: { serviceId: string; staffId: string | 'ANY' }[];
    organizationId: string;
  }): Promise<AvailabilityChainPlan[]> {
    const { branchId, date, chain, organizationId } = params;

    if (!branchId?.trim()) {
      throw new BadRequestException('branchId is required');
    }

    if (!date?.trim()) {
      throw new BadRequestException('date is required');
    }

    if (!chain?.length) {
      throw new BadRequestException('Chain is required');
    }

    if (!organizationId?.trim()) {
      throw new BadRequestException('organizationId is required');
    }

    // 1) Branch by id
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // 2) Permission check: branch pertenece a la org del manager
    if (branch.organizationId !== organizationId) {
      throw new ForbiddenException('You do not have access to this branch');
    }

    // 3) Delegate to CORE
    return this.core.getAvailableTimesChain({
      branchId: branch.id,
      date,
      chain,
    });
  }
}
