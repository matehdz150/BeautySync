// infrastructure/controllers/benefit-program.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/application/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/application/guards/roles.guard';
import { Roles } from 'src/modules/auth/application/decorators/roles.decorator';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

import { ActivateBenefitProgramUseCase } from '../../core/use-cases/activate-benefit-programm.use-case';
import { GetBenefitRulesByBranchUseCase } from '../../core/use-cases/get-benefit-rules-by-branch.use-case';
import { BenefitEarnRuleType } from '../../core/engine/benefit-rule-handler.interface';
import { CreateBenefitEarnRuleUseCase } from '../../core/use-cases/create-benefit-earn-rule.use-case';
import { CreateBenefitRewardDto } from '../dto/create-benefit-reward.dto';
import { CreateBenefitRewardUseCase } from '../../core/use-cases/create-benefit-reward.use-case';
import {
  PublicSession,
  PublicUser,
} from 'src/modules/auth/application/decorators/public-user.decorator';
import { GetUserWalletSummaryUseCase } from '../../core/use-cases/get-user-points.use-case';
import { PublicAuthGuard } from 'src/modules/auth/application/guards/public-auth.guard';
import { DeleteBenefitEarnRuleUseCase } from '../../core/use-cases/delete-benefit-earn-rule.use-case';
import { UpdateBenefitEarnRuleUseCase } from '../../core/use-cases/update-benefit-earn-rule.use-case';
import { GetBenefitRuleByIdUseCase } from '../../core/use-cases/get-rule-by-id.use-case';
import { UpdateBenefitRewardUseCase } from '../../core/use-cases/update-benefit-reward.use-case';
import { DeleteBenefitRewardUseCase } from '../../core/use-cases/delete-benefit-reward.use-case';
import { GetBenefitRewardByIdUseCase } from '../../core/use-cases/get-benefit-reward-by-id.use-case';

@Controller('benefits/program')
export class BenefitProgramController {
  constructor(
    private readonly activateProgram: ActivateBenefitProgramUseCase,
    private readonly getRules: GetBenefitRulesByBranchUseCase,
    private readonly createRule: CreateBenefitEarnRuleUseCase,
    private readonly createReward: CreateBenefitRewardUseCase,
    private readonly getUserPoints: GetUserWalletSummaryUseCase,
    private readonly updateRule: UpdateBenefitEarnRuleUseCase,
    private readonly deleteRule: DeleteBenefitEarnRuleUseCase,
    private readonly getRuleById: GetBenefitRuleByIdUseCase,
    private readonly updateReward: UpdateBenefitRewardUseCase,
    private readonly deleteReward: DeleteBenefitRewardUseCase,
    private readonly getRewardByIdUseCase: GetBenefitRewardByIdUseCase,
  ) {}

  @UseGuards(PublicAuthGuard)
  @Get('wallet')
  async getMyPoints(@PublicUser() user: PublicSession) {
    return this.getUserPoints.execute(user.publicUserId);
  }

  // =========================
  // ACTIVATE PROGRAM
  // =========================
  @Post('activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  activate(
    @Body()
    body: {
      branchId: string;
      name?: string;
    },
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.activateProgram.execute({
      branchId: body.branchId,
      name: body.name,
      user: req.user,
    });
  }

  @Post('/earnrule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  create(
    @Body()
    body: {
      branchId: string;
      type: BenefitEarnRuleType;
      config: unknown;
    },
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.createRule.execute({
      branchId: body.branchId,
      type: body.type,
      config: body.config,
      user: req.user,
    });
  }

  @Patch('/earnrule/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  update(
    @Param('id') ruleId: string,
    @Body()
    body: {
      branchId: string;
      type?: BenefitEarnRuleType;
      config?: unknown;
      isActive?: boolean;
    },
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.updateRule.execute({
      ruleId,
      branchId: body.branchId,
      type: body.type,
      config: body.config,
      isActive: body.isActive,
      user: req.user,
    });
  }

  @Delete('/earnrule/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  delete(
    @Param('id') ruleId: string,
    @Body() body: { branchId: string },
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.deleteRule.execute({
      ruleId,
      branchId: body.branchId,
      user: req.user,
    });
  }

  // =========================
  // GET RULE BY ID
  // =========================
  @Get('/earnrule/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  getRuleByIdEx(
    @Param('id') ruleId: string,
    @Query('branchId') branchId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.getRuleById.execute({
      ruleId,
      branchId,
      user: req.user,
    });
  }

  // =========================
  // CREATE REWARD
  // =========================
  @Post('/reward')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  createRewardEx(
    @Body() body: CreateBenefitRewardDto,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.createReward.execute({
      branchId: body.branchId,
      type: body.type,
      name: body.name ?? '',
      pointsCost: body.pointsCost,
      referenceId: body.referenceId,
      stock: body.stock,
      config: body.config,
      user: req.user,
    });
  }

  @Patch('/reward/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  updateRewardEx(
    @Param('id') rewardId: string,
    @Body()
    body: {
      branchId: string;
      type?: 'SERVICE' | 'PRODUCT' | 'COUPON' | 'GIFT_CARD' | 'CUSTOM';
      name?: string;
      pointsCost?: number;
      referenceId?: string | null;
      stock?: number | null;
      config?: unknown;
      isActive?: boolean;
    },
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.updateReward.execute({
      rewardId,
      branchId: body.branchId,
      type: body.type,
      name: body.name,
      pointsCost: body.pointsCost,
      referenceId: body.referenceId,
      stock: body.stock,
      config: body.config,
      isActive: body.isActive,
      user: req.user,
    });
  }

  // =========================
  // GET REWARD BY ID
  // =========================
  @Get('/reward/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  getRewardById(
    @Param('id') rewardId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    console.log(rewardId);
    return this.getRewardByIdUseCase.execute({
      rewardId,
      user: req.user,
    });
  }

  @Delete('/reward/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  deleteRewardEx(
    @Param('id') rewardId: string,
    @Body() body: { branchId: string },
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.deleteReward.execute({
      rewardId,
      branchId: body.branchId,
      user: req.user,
    });
  }

  // =========================
  // GET RULES BY BRANCH
  // =========================
  @Get('/branch/:branchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  getByBranch(
    @Param('branchId') branchId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.getRules.execute({
      branchId,
      user: req.user,
    });
  }
}
