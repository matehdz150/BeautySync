// infrastructure/controllers/benefit-program.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/application/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/application/guards/roles.guard';
import { Roles } from 'src/modules/auth/application/decorators/roles.decorator';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

import { ActivateBenefitProgramUseCase } from '../../core/use-cases/activate-benefit-programm.use-case';
import { GetBenefitRulesByBranchUseCase } from '../../core/use-cases/get-benefit-rules-by-branch.use-case';

@Controller('benefits/program')
export class BenefitProgramController {
  constructor(
    private readonly activateProgram: ActivateBenefitProgramUseCase,
    private readonly getRules: GetBenefitRulesByBranchUseCase,
  ) {}

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
