// infrastructure/controllers/coupons.controller.ts

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

import { PublicAuthGuard } from 'src/modules/auth/application/guards/public-auth.guard';
import { PublicUser } from 'src/modules/auth/application/decorators/public-user.decorator';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

import { CreateCouponUseCase } from '../core/use-cases/create-coupon.use-case';
import { ValidateCouponUseCase } from '../core/use-cases/validate-cupon.use-case';
import { GetCouponsByBranchUseCase } from '../core/use-cases/get-coupons-by-branch.use-case';

@Controller('coupons')
export class CouponsController {
  constructor(
    private readonly createCoupon: CreateCouponUseCase,
    private readonly validateCoupon: ValidateCouponUseCase,
    private readonly getCouponsByBranch: GetCouponsByBranchUseCase,
  ) {}

  // =========================
  // ADMIN CREATE
  // =========================
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  create(
    @Body()
    body: {
      branchId: string;
      code: string;

      type: 'percentage' | 'fixed';
      value: number;

      minAmountCents?: number;
      maxDiscountCents?: number;

      usageLimit?: number;
      assignedToUserId?: string;

      expiresAt?: string;
    },
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.createCoupon.execute({
      ...body,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      user: req.user,
    });
  }

  // =========================
  // PUBLIC VALIDATE (checkout)
  // =========================
  @Post('validate')
  @UseGuards(PublicAuthGuard)
  validate(
    @Body()
    body: {
      code: string;
      branchId: string;
      amountCents: number;
      services?: string[];
    },
    @PublicUser() user: { publicUserId: string },
  ) {
    return this.validateCoupon.execute({
      ...body,
      publicUserId: user.publicUserId,
    });
  }

  @Get('/branch/:branchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  getByBranch(
    @Param('branchId') branchId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.getCouponsByBranch.execute({
      branchId,
      user: req.user,
    });
  }
}
