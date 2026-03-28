import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { GetPublicBranchUseCase } from '../../core/use-cases/public/get-public-branch.use-case';
import { GetPublicBranchSummaryUseCase } from '../../core/use-cases/public/get-public-summary.use-case';

// 🔥 auth
import { PublicAuthGuard } from 'src/modules/auth/application/guards/public-auth.guard';
import {
  PublicUser,
  PublicSession,
} from 'src/modules/auth/application/decorators/public-user.decorator';

@Controller('branches')
export class BranchesPublicController {
  constructor(
    private readonly getPublicBranchInfo: GetPublicBranchUseCase,
    private readonly getPublicBranchSummary: GetPublicBranchSummaryUseCase,
  ) {}

  // =========================
  // 🌍 PUBLIC (sin auth)
  // =========================
  // GET /branches/:slug
  @Get(':slug')
  getPublicBranch(@Param('slug') slug: string) {
    return this.getPublicBranchInfo.execute(slug);
  }

  // =========================
  // ❤️ SUMMARY (con auth)
  // =========================
  // GET /branches/:id/summary
  @Get(':id/summary')
  @UseGuards(PublicAuthGuard)
  getSummary(@Param('id') branchId: string, @PublicUser() user: PublicSession) {
    return this.getPublicBranchSummary.execute(branchId, user.publicUserId);
  }
}
