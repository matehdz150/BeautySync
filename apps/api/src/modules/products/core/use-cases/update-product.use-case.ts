import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PRODUCT_REPOSITORY } from '../ports/tokens';
import * as repo from '../ports/product.port';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import * as cache from 'src/modules/cache/core/ports/cache.port';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';
import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly repository: repo.ProductRepository,

    @Inject(CACHE_PORT)
    private readonly cache: cache.CachePort,
    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(
    id: string,
    data: Parameters<repo.ProductRepository['update']>[1],
    user: AuthenticatedUser,
  ) {
    // =========================
    // FIND
    // =========================
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    // =========================
    // 🔥 ACCESS CONTROL
    // =========================
    const branch = await this.branchesRepo.findById(existing.branchId);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('No tienes acceso a este producto');
    }

    // =========================
    // UPDATE
    // =========================
    const updated = await this.repository.update(id, data);

    // =========================
    // CACHE INVALIDATION
    // =========================
    await this.cache.del(`products:branch:${existing.branchId}`);

    return updated;
  }
}
