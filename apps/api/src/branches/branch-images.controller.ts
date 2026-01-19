import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { BranchImagesService } from './branch-images.service';

@Controller('branches/:branchId/images')
export class BranchImagesController {
  constructor(private readonly service: BranchImagesService) {}

  @Get()
  getAll(@Param('branchId') branchId: string) {
    return this.service.getByBranch(branchId);
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
    return this.service.addImage(branchId, body);
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
    return this.service.updateImage(branchId, imageId, body);
  }

  @Delete(':imageId')
  remove(
    @Param('branchId') branchId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.service.deleteImage(branchId, imageId);
  }
}
