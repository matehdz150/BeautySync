import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { BranchImagesController } from './branch-images.controller';
import { BranchImagesService } from './branch-images.service';
import { AuthModule } from '../../auth/manager/auth.module';
import { BranchesPublicController } from '../public/branches.public.controller';
import { BranchesPublicService } from '../public/branches.public.service';
import { BranchSettingsController } from './branch-settings.controller';
import { BranchSettingsService } from './branch-settings.service';

@Module({
  imports: [AuthModule],
  controllers: [
    BranchesController,
    BranchImagesController,
    BranchesPublicController,
    BranchSettingsController,
  ],
  providers: [
    BranchesService,
    BranchImagesService,
    BranchesPublicService,
    BranchSettingsService,
  ],
  exports: [BranchesService],
})
export class BranchesModule {}
