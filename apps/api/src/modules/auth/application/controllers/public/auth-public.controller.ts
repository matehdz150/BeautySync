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
import { GetUserBySessionUseCase } from 'src/modules/auth/core/use-cases/public/get-user-by-session.use-case';
import { LogoutPublicUseCase } from 'src/modules/auth/core/use-cases/public/logout-public.use-case';
import { PublicAuthGuard } from '../../guards/public-auth.guard';

@Controller('public/auth')
export class PublicAuthController {
  constructor(
    private readonly loginGoogleUseCase: LoginGoogleUseCase,
    private readonly getUserBySessionUseCase: GetUserBySessionUseCase,
    private readonly logoutPublicSessionUseCase: LogoutPublicUseCase,
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

    res.cookie(cookieName, result.sessionId, {
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
    });

    return { ok: true };
  }

  /*
  =========================
  GET CURRENT USER
  =========================
  */
  @UseGuards(PublicAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    const cookieName = process.env.PUBLIC_SESSION_COOKIE_NAME ?? 'pubsid';

    const sessionId = req.cookies?.[cookieName] ?? '';

    const user = await this.getUserBySessionUseCase.execute(sessionId);

    if (!user) {
      return { ok: true, user: null };
    }

    return {
      ok: true,
      user: {
        id: user.id,
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
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieName = process.env.PUBLIC_SESSION_COOKIE_NAME ?? 'pubsid';

    const sessionId = req.cookies?.[cookieName] ?? '';

    await this.logoutPublicSessionUseCase.execute(sessionId);

    res.clearCookie(cookieName, { path: '/' });

    return { ok: true };
  }
}
