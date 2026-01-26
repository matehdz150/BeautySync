import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { BranchImagesController } from './branch-images.controller';
import { BranchImagesService } from './branch-images.service';
import { AuthModule } from '../../auth/manager/auth.module';
import { BranchesPublicController } from '../public/branches.public.controller';
import { BranchesPublicService } from '../public/branches.public.service';

@Module({
  imports: [AuthModule],
  controllers: [
    BranchesController,
    BranchImagesController,
    BranchesPublicController,
  ],
  providers: [BranchesService, BranchImagesService, BranchesPublicService],
  exports: [BranchesService],
})
export class BranchesModule {}
