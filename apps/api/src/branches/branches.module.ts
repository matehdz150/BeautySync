import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { BranchImagesController } from './branch-images.controller';
import { BranchImagesService } from './branch-images.service';

@Module({
  controllers: [BranchesController, BranchImagesController],
  providers: [BranchesService, BranchImagesService],
  exports: [BranchesService],
})
export class BranchesModule {}
