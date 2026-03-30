import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PRODUCT_REPOSITORY } from '../ports/tokens';
import * as repo from '../ports/product.port';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';
import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';

@Injectable()
export class GetProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly repository: repo.ProductRepository,
    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(productId: string, user: AuthenticatedUser) {
    const product = await this.repository.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const branch = await this.branchesRepo.findById(product.branchId);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('No tienes acceso a este producto');
    }

    return product;
  }
}
