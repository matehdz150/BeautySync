import { ForbiddenException, Inject } from '@nestjs/common';
import * as branchesRepository from '../../ports/branches.repository';
import { BRANCHES_REPOSITORY } from '../../ports/tokens';

export class ValidateBranchAccessUseCase {
  constructor(
    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: branchesRepository.BranchesRepositoryPort,
  ) {}

  async execute(input: {
    branchId: string;
    userOrgId: string | null;
  }): Promise<void> {
    if (!input.userOrgId) {
      throw new ForbiddenException('Missing organization');
    }

    const branch = await this.branchesRepo.findById(input.branchId);

    if (!branch) {
      throw new ForbiddenException('Branch not found');
    }

    if (branch.organizationId !== input.userOrgId) {
      throw new ForbiddenException('Forbidden branch access');
    }
  }
}
