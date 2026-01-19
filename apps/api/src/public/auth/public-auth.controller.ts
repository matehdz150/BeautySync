import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PublicAuthService } from './public-auth.service';

@Controller('public/auth')
export class PublicAuthController {
  constructor(private readonly auth: PublicAuthService) {}

  @Post('google')
  async google(
    @Body() body: { idToken: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { idToken } = body;

    const ua = req.headers['user-agent'] ?? null;

    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ??
      req.ip ??
      null;

    const result = await this.auth.loginWithGoogle({
      idToken,
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

  @Get('me')
  async me(@Req() req: Request) {
    const cookieName = process.env.PUBLIC_SESSION_COOKIE_NAME ?? 'pubsid';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const sessionId = (req.cookies?.[cookieName] as string | undefined) ?? '';

    const user = await this.auth.getUserBySession(sessionId);
    if (!user) return { ok: true, user: null };

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

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieName = process.env.PUBLIC_SESSION_COOKIE_NAME ?? 'pubsid';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const sessionId = (req.cookies?.[cookieName] as string | undefined) ?? '';

    await this.auth.logout(sessionId);

    res.clearCookie(cookieName, { path: '/' });

    return { ok: true };
  }
}
