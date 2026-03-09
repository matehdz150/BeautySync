import { Controller, Get, Param } from '@nestjs/common';
import { GetPublicBranchUseCase } from '../../core/use-cases/public/get-public-branch.use-case';

@Controller('branches')
export class BranchesPublicController {
  constructor(private readonly getPublicBranchInfo: GetPublicBranchUseCase) {}

  // GET /branches/:slug
  @Get(':slug')
  getPublicBranch(@Param('slug') slug: string) {
    return this.getPublicBranchInfo.execute(slug);
  }
}
