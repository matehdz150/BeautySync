import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/modules/auth/application/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/application/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/application/guards/roles.guard';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

import { CreateTierWithRewardsUseCase } from 'src/modules/benefits/core/use-cases/tiers/create-benefit-tier.use-case';
import { DeleteTierUseCase } from 'src/modules/benefits/core/use-cases/tiers/delete-tier.use-case';
import { GetBranchTiersUseCase } from 'src/modules/benefits/core/use-cases/tiers/get-branch-tiers.use-case';
import { UpdateTierWithRewardsUseCase } from 'src/modules/benefits/core/use-cases/tiers/update-tier-with-reward.use-case';

@Controller('benefits/tiers')
export class BenefitTiersController {
  constructor(
    private readonly createTierWithRewards: CreateTierWithRewardsUseCase,
    private readonly getBranchTiersUseCase: GetBranchTiersUseCase,
    private readonly updateTierUseCase: UpdateTierWithRewardsUseCase,
    private readonly deleteTierUseCase: DeleteTierUseCase,
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

  @Patch(':tierId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  updateTier(
    @Param('tierId') tierId: string,
    @Body()
    body: {
      branchId: string;

      name?: string;
      description?: string;
      color?: string;
      icon?: string;
      minPoints?: number;

      rewards?: {
        type: 'ONE_TIME' | 'RECURRING';
        config: any;
      }[];
    },
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.updateTierUseCase.execute({
      tierId,
      ...body,
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

  @Delete(':tierId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  deleteTier(
    @Param('tierId') tierId: string,
    @Body('branchId') branchId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.deleteTierUseCase.execute({
      tierId,
      branchId,
      user: req.user,
    });
  }
}
