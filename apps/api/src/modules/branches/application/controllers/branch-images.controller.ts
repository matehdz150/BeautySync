import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { GetBranchImagesUseCase } from '../../core/use-cases/manager/get-branch-images.use-case';
import { AddBranchImageUseCase } from '../../core/use-cases/manager/add-branch-image.use-case';
import { UpdateBranchImageUseCase } from '../../core/use-cases/manager/update-branch-image.use-case';
import { DeleteBranchImageUseCase } from '../../core/use-cases/manager/delete-branch-image.use-case';

@Controller('branches/:branchId/images')
export class BranchImagesController {
  constructor(
    private readonly getImages: GetBranchImagesUseCase,
    private readonly addImage: AddBranchImageUseCase,
    private readonly updateImage: UpdateBranchImageUseCase,
    private readonly deleteImage: DeleteBranchImageUseCase,
  ) {}

  @Get()
  getAll(@Param('branchId') branchId: string) {
    return this.getImages.execute(branchId);
  }

  @Post()
  add(
    @Param('branchId') branchId: string,
    @Body()
    body: {
      url: string;
      publicId: string;
      isCover?: boolean;
    },
  ) {
    return this.addImage.execute(branchId, body);
  }

  @Patch(':imageId')
  update(
    @Param('branchId') branchId: string,
    @Param('imageId') imageId: string,
    @Body()
    body: {
      isCover?: boolean;
      position?: number;
    },
  ) {
    return this.updateImage.execute(branchId, imageId, body);
  }

  @Delete(':imageId')
  remove(
    @Param('branchId') branchId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.deleteImage.execute(branchId, imageId);
  }
}
