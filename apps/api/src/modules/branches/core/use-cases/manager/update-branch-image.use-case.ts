import { Inject, Injectable } from '@nestjs/common';
import { BRANCH_IMAGES_REPOSITORY } from '../../ports/tokens';
import * as branchImagesRepository from '../../ports/branch-images.repository';

@Injectable()
export class UpdateBranchImageUseCase {
  constructor(
    @Inject(BRANCH_IMAGES_REPOSITORY)
    private repo: branchImagesRepository.BranchImagesRepository,
  ) {}

  execute(
    branchId: string,
    imageId: string,
    input: branchImagesRepository.UpdateBranchImageInput,
  ) {
    return this.repo.updateImage(branchId, imageId, input);
  }
}
