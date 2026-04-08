import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { LoginGoogleUseCase } from 'src/modules/auth/core/use-cases/public/login-google.use-case';
import { PublicSession, PublicUser } from '../../decorators/public-user.decorator';
import { PublicAuthGuard } from '../../guards/public-auth.guard';
import { TokensService } from '../../services/tokens.service';

@Controller('public/auth')
export class PublicAuthController {
  constructor(
    private readonly loginGoogleUseCase: LoginGoogleUseCase,
    private readonly tokensService: TokensService,
  ) {}

  /*
  =========================
  GOOGLE LOGIN
  =========================
  */

  @Post('google')
  async google(
    @Body() body: { idToken: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ua = req.headers['user-agent'] ?? null;

    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ??
      req.ip ??
      null;

    const result = await this.loginGoogleUseCase.execute({
      idToken: body.idToken,
      userAgent: ua,
      ip,
    });

    const cookieName = process.env.PUBLIC_SESSION_COOKIE_NAME ?? 'pubsid';

    res.cookie(
      cookieName,
      this.tokensService.signPublicToken({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        avatarUrl: result.user.avatarUrl,
      }),
      {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge:
        1000 *
        60 *
        60 *
        24 *
        Number(process.env.PUBLIC_SESSION_TTL_DAYS ?? '30'),
      },
    );

    return { ok: true };
  }

  /*
  =========================
  GET CURRENT USER
  =========================
  */
  @UseGuards(PublicAuthGuard)
  @Get('me')
  async me(@PublicUser() user: PublicSession) {
    return {
      ok: true,
      user: {
        id: user.publicUserId,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  /*
  =========================
  LOGOUT
  =========================
  */

  @Post('logout')
  async logout(
    @Req() _req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieName = process.env.PUBLIC_SESSION_COOKIE_NAME ?? 'pubsid';

    res.clearCookie(cookieName, { path: '/' });

    return { ok: true };
  }
}
