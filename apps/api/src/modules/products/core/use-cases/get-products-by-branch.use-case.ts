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
export class GetProductsByBranchUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly repository: repo.ProductRepository,

    @Inject(CACHE_PORT)
    private readonly cache: cache.CachePort,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(branchId: string, user: AuthenticatedUser) {
    // =========================
    // 🔥 ACCESS CONTROL
    // =========================
    const branch = await this.branchesRepo.findById(branchId);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('No tienes acceso a esta sucursal');
    }

    // =========================
    // CACHE
    // =========================
    const cacheKey = `products:branch:${branchId}`;

    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const products = await this.repository.findByBranch(branchId);

    await this.cache.set(cacheKey, products, 60);

    return products;
  }
}
