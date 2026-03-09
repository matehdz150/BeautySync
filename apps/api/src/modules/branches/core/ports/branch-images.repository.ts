import { BranchImage } from '../entities/branch-image.entity';

export interface CreateBranchImageInput {
  url: string;
  publicId: string;
  isCover?: boolean;
}

export interface UpdateBranchImageInput {
  isCover?: boolean;
  position?: number;
}

export interface BranchImagesRepository {
  getByBranch(branchId: string): Promise<BranchImage[]>;

  addImage(
    branchId: string,
    input: CreateBranchImageInput,
  ): Promise<BranchImage>;

  updateImage(
    branchId: string,
    imageId: string,
    input: UpdateBranchImageInput,
  ): Promise<BranchImage>;

  deleteImage(branchId: string, imageId: string): Promise<BranchImage>;
}
