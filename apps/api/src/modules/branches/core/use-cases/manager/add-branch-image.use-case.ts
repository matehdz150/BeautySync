import { Inject, Injectable } from '@nestjs/common';
import { BRANCH_IMAGES_REPOSITORY } from '../../ports/tokens';
import * as branchImagesRepository from '../../ports/branch-images.repository';

@Injectable()
export class AddBranchImageUseCase {
  constructor(
    @Inject(BRANCH_IMAGES_REPOSITORY)
    private repo: branchImagesRepository.BranchImagesRepository,
  ) {}

  execute(
    branchId: string,
    input: branchImagesRepository.CreateBranchImageInput,
  ) {
    return this.repo.addImage(branchId, input);
  }
}
