import { Inject, Injectable } from '@nestjs/common';
import { BRANCH_SETTINGS_REPOSITORY } from '../../ports/tokens';
import * as branchSettingsRepository from '../../ports/branch-settings.repository';

@Injectable()
export class GetBranchSettingsUseCase {
  constructor(
    @Inject(BRANCH_SETTINGS_REPOSITORY)
    private readonly repo: branchSettingsRepository.BranchSettingsRepository,
  ) {}

  execute(branchId: string) {
    return this.repo.getByBranch(branchId);
  }
}
