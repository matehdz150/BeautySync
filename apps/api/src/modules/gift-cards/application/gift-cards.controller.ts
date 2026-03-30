import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/application/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/application/guards/roles.guard';
import { Roles } from 'src/modules/auth/application/decorators/roles.decorator';

import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

// use cases
import { CreateGiftCardUseCase } from '../core/use-cases/create-gift-card.use-case';
import { GetGiftCardsByBranchUseCase } from '../core/use-cases/get-gift-cards-by-branch.use-case';
import { GetUserGiftCardsUseCase } from '../core/use-cases/get-gift-cards-by-user.use-case';
import { GetGiftCardUseCase } from '../core/use-cases/get-gift-card.use-case';
import { GetGiftCardTransactionsUseCase } from '../core/use-cases/get-gift-card-transactions.use-case';
import { AssignGiftCardToUserUseCase } from '../core/use-cases/assign-gift-card-to-user.use-case';
import { UnassignGiftCardFromUserUseCase } from '../core/use-cases/unassign-gift-card-user.use-case';

// dtos
import { CreateGiftCardDto } from './dto/create-gift-card.dto';
import { AssignGiftCardDto } from './dto/assign-gift-card.dto';
import { UnAssignGiftCardDto } from './dto/unassign-gift-card.dto';
import { GetMyGiftCardsUseCase } from '../core/use-cases/get-my-gift-cards.use-case';
import { PublicAuthGuard } from 'src/modules/auth/application/guards/public-auth.guard';
import { PublicUser } from 'src/modules/auth/application/decorators/public-user.decorator';
import { ClaimGiftCardUseCase } from '../core/use-cases/claim-gift-card.use-case';
import { GetGiftCardByCodeUseCase } from '../core/use-cases/get-gift-card-by-code.use-case';

@Controller('gift-cards')
export class GiftCardsController {
  constructor(
    private readonly createGiftCard: CreateGiftCardUseCase,
    private readonly getByBranch: GetGiftCardsByBranchUseCase,
    private readonly getUserGiftCards: GetUserGiftCardsUseCase,
    private readonly getMyGiftCards: GetMyGiftCardsUseCase,
    private readonly getOne: GetGiftCardUseCase,
    private readonly getTransactions: GetGiftCardTransactionsUseCase,
    private readonly assign: AssignGiftCardToUserUseCase,
    private readonly unassign: UnassignGiftCardFromUserUseCase,
    private readonly claimUseCase: ClaimGiftCardUseCase,
    private readonly getByCode: GetGiftCardByCodeUseCase,
  ) {}

  @Get('by-code')
  async getByCodeQuery(@Query('code') code: string) {
    return this.getByCode.execute(code);
  }

  // =========================
  // CREATE
  // =========================
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  create(
    @Body() dto: CreateGiftCardDto,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.createGiftCard.execute({
      ...dto,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      user: req.user,
    });
  }

  // =========================
  // GET BY BRANCH
  // =========================
  @Get('/branch/:branchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  getByBranchEx(
    @Param('branchId') branchId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.getByBranch.execute({
      branchId,
      user: req.user,
    });
  }

  // =========================
  // GET BY USER (PUBLIC USER)
  // =========================
  @Get('/me')
  @UseGuards(JwtAuthGuard)
  getMine(@Req() req: { user: AuthenticatedUser }) {
    return this.getMyGiftCards.execute(req.user.id);
  }

  @Get('/user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  getUserCards(
    @Param('userId') userId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.getUserGiftCards.execute({
      userId,
      requester: req.user,
    });
  }

  // =========================
  // GET ONE
  // =========================
  @Get('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  getOneById(@Param('id') id: string, @Req() req: { user: AuthenticatedUser }) {
    return this.getOne.execute({
      id,
      user: req.user,
    });
  }

  // =========================
  // TRANSACTIONS
  // =========================
  @Get('/:id/transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  getTransactionsByGiftCard(
    @Param('id') id: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.getTransactions.execute({
      giftCardId: id,
      user: req.user,
    });
  }

  // =========================
  // ASSIGN
  // =========================
  @Post('/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  assignToUser(
    @Body() dto: AssignGiftCardDto,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.assign.execute({
      giftCardId: dto.giftCardId,
      userId: dto.userId,
      user: req.user,
    });
  }

  // =========================
  // UNASSIGN
  // =========================
  @Post('/unassign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'manager')
  unassignFromUser(
    @Body() dto: UnAssignGiftCardDto,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.unassign.execute({
      giftCardId: dto.giftCardId,
      user: req.user,
    });
  }

  @Post('claim')
  @UseGuards(PublicAuthGuard)
  claim(
    @Body() body: { code: string },
    @PublicUser() user: { publicUserId: string },
  ) {
    return this.claimUseCase.execute({
      code: body.code,
      publicUserId: user.publicUserId,
    });
  }
}
