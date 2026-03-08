/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import express from 'express';

import { LoginDto } from '../../dto/login.dto';
import { RegisterOwnerDto } from '../../dto/register-owner.dto';
import { AdminCreateUserDto } from '../../dto/admin-create-user';
import { AcceptInviteDto } from '../../dto/accept-invite.dto';

import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';

import { Roles } from '../../decorators/roles.decorator';

import { LoginUseCase } from 'src/modules/auth/core/use-cases/manager/login.use-case';
import { RegisterOwnerUseCase } from 'src/modules/auth/core/use-cases/manager/register-owner.use-case';
import { RegisterAdminUseCase } from 'src/modules/auth/core/use-cases/manager/register-admin.use-case';
import { ValidateInviteUseCase } from 'src/modules/auth/core/use-cases/manager/validate-invite.use-case';
import { AcceptInviteUseCase } from 'src/modules/auth/core/use-cases/manager/accept-invite.use-case';

import { TokensService } from '../../services/tokens.service';
import { RefreshJwtGuard } from '../../guards/refresh-jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private loginUseCase: LoginUseCase,
    private registerOwnerUseCase: RegisterOwnerUseCase,
    private registerAdminUseCase: RegisterAdminUseCase,
    private validateInviteUseCase: ValidateInviteUseCase,
    private acceptInviteUseCase: AcceptInviteUseCase,
    private tokensService: TokensService,
  ) {}

  /*
  =========================
  CREATE USER (ADMIN)
  =========================
  */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('users')
  createUser(@Body() dto: AdminCreateUserDto) {
    return this.registerAdminUseCase.execute(dto);
  }

  /*
  =========================
  REGISTER OWNER
  =========================
  */

  @Post('register')
  async registerOwner(
    @Body() dto: RegisterOwnerDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const user = await this.registerOwnerUseCase.execute(dto);

    const tokens = this.tokensService.signTokens({
      id: user.id,
      role: user.role,
      organizationId: user.organizationId ?? null,
    });

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth/refresh',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.organizationId ?? null,
      },
    };
  }

  /*
  =========================
  LOGIN
  =========================
  */

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.loginUseCase.execute(dto.email, dto.password);

    const tokens = this.tokensService.signTokens({
      id: result.user.id,
      role: result.user.role,
      organizationId: result.user.organizationId,
    });

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth/refresh',
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        orgId: result.user.organizationId,
      },
    };
  }

  /*
  =========================
  VALIDATE INVITE
  =========================
  */

  @Get('validate-invite/:token')
  validateInvite(@Param('token') token: string) {
    return this.validateInviteUseCase.execute(token);
  }

  /*
  =========================
  ACCEPT INVITE
  =========================
  */

  @Post('accept-invite')
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.acceptInviteUseCase.execute(dto);
  }

  /*
  =========================
  REFRESH TOKEN
  =========================
  */

  @Post('refresh')
  @UseGuards(RefreshJwtGuard)
  refresh(@Req() req: any, @Res({ passthrough: true }) res: express.Response) {
    type JwtPayload = {
      sub: string;
      role: string;
      orgId: string | null;
    };

    const payload = req.user as JwtPayload;

    const tokens = this.tokensService.signTokens({
      id: payload.sub,
      role: payload.role,
      organizationId: payload.orgId,
    });

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { ok: true };
  }

  /*
  =========================
  LOGOUT
  =========================
  */

  @Post('logout')
  logout(@Res({ passthrough: true }) res: express.Response) {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/auth/refresh' });

    return { ok: true };
  }
}
