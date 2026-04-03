import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/modules/auth/application/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/application/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/application/guards/roles.guard';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

import { CreateTierWithRewardsUseCase } from 'src/modules/benefits/core/use-cases/tiers/create-benefit-tier.use-case';
import { GetBranchTiersUseCase } from 'src/modules/benefits/core/use-cases/tiers/get-branch-tiers.use-case';

@Controller('benefits/tiers')
export class BenefitTiersController {
  constructor(
    private readonly createTierWithRewards: CreateTierWithRewardsUseCase,
    private readonly getBranchTiersUseCase: GetBranchTiersUseCase,
  ) {}

  // =========================
  // GET TIERS BY BRANCH
  // =========================
  @Get(':branchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  getTiers(
    @Param('branchId') branchId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.getBranchTiersUseCase.execute({
      branchId,
      user: req.user,
    });
  }

  @Post()
  async createTier(
    @Body()
    body: {
      branchId: string;

      name: string;
      description?: string;
      color?: string;
      icon?: string;

      minPoints: number;

      rewards?: {
        type: 'ONE_TIME' | 'RECURRING';
        config: unknown;
      }[];
    },
  ) {
    return this.createTierWithRewards.execute({
      ...body,
      rewards: body.rewards ?? [],
    });
  }
}
