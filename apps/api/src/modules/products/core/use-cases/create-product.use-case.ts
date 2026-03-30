import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PRODUCT_REPOSITORY } from '../ports/tokens';
import * as repo from '../ports/product.port';

import { CACHE_PORT } from 'src/modules/cache/core/ports/tokens';
import * as cache from 'src/modules/cache/core/ports/cache.port';

import { buildProductSlug } from '../helpers/product-slug';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';
import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly repository: repo.ProductRepository,

    @Inject(CACHE_PORT)
    private readonly cache: cache.CachePort,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(input: {
    branchId: string;
    name: string;
    priceCents: number;
    description?: string;
    imageUrl?: string;
    user: AuthenticatedUser;
  }) {
    // =========================
    // VALIDATIONS
    // =========================
    if (!input.name) {
      throw new BadRequestException('Name is required');
    }

    if (input.priceCents < 0) {
      throw new BadRequestException('Invalid price');
    }

    // =========================
    // 🔥 ACCESS CONTROL
    // =========================
    const branch = await this.branchesRepo.findById(input.branchId);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!input.user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('No tienes acceso a esta sucursal');
    }

    // =========================
    // SLUG
    // =========================
    const slug = buildProductSlug(input.name);

    // =========================
    // CREATE
    // =========================
    const product = await this.repository.create({
      branchId: input.branchId,
      name: input.name,
      slug,
      priceCents: input.priceCents,
      description: input.description,
      imageUrl: input.imageUrl,
    });

    // =========================
    // CACHE INVALIDATION
    // =========================
    await this.cache.del(`products:branch:${input.branchId}`);

    return product;
  }
}
