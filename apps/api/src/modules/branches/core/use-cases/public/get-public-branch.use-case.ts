import { Inject, Injectable } from '@nestjs/common';
import { PUBLIC_BRANCHES_REPOSITORY } from '../../ports/tokens';
import * as publicBranchesRepository from '../../ports/public-branches.repository';

@Injectable()
export class GetPublicBranchUseCase {
  constructor(
    @Inject(PUBLIC_BRANCHES_REPOSITORY)
    private readonly repo: publicBranchesRepository.PublicBranchesRepository,
  ) {}

  execute(slug: string) {
    return this.repo.getBySlug(slug);
  }
}
