/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto';
import { PublicRegisterDto } from '../dto/public-register.dto';
import { Roles } from './roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminCreateUserDto } from '../dto/admin-create-user';
import { RolesGuard } from './guards/roles.guard';
import { AcceptInviteDto } from '../dto/accept-invite.dto';
import { RefreshJwtGuard } from './guards/refresh-jwt.guard';

@Controller('auth')
export class AuthController {
  authService: any;
  constructor(private service: AuthService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('users')
  createUser(@Body() dto: AdminCreateUserDto) {
    return this.service.registerAdmin(dto);
  }

  @Post('register')
  registerPublic(@Body() dto: PublicRegisterDto) {
    return this.service.registerPublic(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.service.login(dto.email, dto.password);

    // 🔥 ACCESS TOKEN EN COOKIE
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // 🔥 REFRESH TOKEN EN COOKIE
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth/refresh',
    });

    return {
      user: result.user,
    };
  }

  @Get('validate-invite/:token')
  async validateInvite(@Param('token') token: string) {
    const invite = await this.service.validateInvite(token);
    return invite;
  }

  @Post('accept-invite')
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.service.acceptInvite(dto);
  }

  @Get('debug-headers')
  debugHeaders(@Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return req.headers;
  }

  @Post('refresh')
  @UseGuards(RefreshJwtGuard)
  refresh(@Req() req: any, @Res({ passthrough: true }) res: express.Response) {
    const payload = req.user;

    const tokens = this.service.signTokens({
      id: payload.sub,
      role: payload.role,
      organizationId: payload.orgId,
    } as any);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { ok: true };
  }
}
