import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { and, eq, gt } from 'drizzle-orm';

import type * as client from 'src/db/client';
import { publicUsers } from 'src/db/schema';
import { publicSessions } from 'src/db/schema/public/public-sessions';

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

@Injectable()
export class PublicAuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(@Inject('DB') private readonly db: client.DB) {}

  async loginWithGoogle(params: {
    idToken: string;
    userAgent?: string | null;
    ip?: string | null;
  }) {
    const { idToken, userAgent, ip } = params;

    if (!idToken) throw new UnauthorizedException('idToken is required');

    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new UnauthorizedException('Invalid Google token');

    const googleSub = payload.sub;
    const email = payload.email ?? null;
    const emailVerified = payload.email_verified === true;
    const name = payload.name ?? null;
    const avatarUrl = payload.picture ?? null;

    if (!googleSub) throw new UnauthorizedException('Missing google sub');

    // 1) buscar usuario por googleSub
    let existing = await this.db.query.publicUsers.findFirst({
      where: eq(publicUsers.googleSub, googleSub),
    });

    // 2) opcional: merge por email (solo si email está verificado)
    if (!existing && email && emailVerified) {
      existing = await this.db.query.publicUsers.findFirst({
        where: eq(publicUsers.email, email),
      });

      // si encontramos por email, “conectamos” ese user al googleSub
      if (existing) {
        await this.db
          .update(publicUsers)
          .set({
            googleSub,
            name: name ?? existing.name,
            avatarUrl: avatarUrl ?? existing.avatarUrl,
            lastLoginAt: new Date(),
          })
          .where(eq(publicUsers.id, existing.id));
      }
    }

    let userId: string;

    if (!existing) {
      const inserted = await this.db
        .insert(publicUsers)
        .values({
          email: emailVerified ? email : null,
          googleSub,
          name,
          avatarUrl,
          lastLoginAt: new Date(),
        })
        .returning({ id: publicUsers.id });

      userId = inserted[0].id;
    } else {
      userId = existing.id;

      await this.db
        .update(publicUsers)
        .set({
          // no sobre-escribas email si no está verificado
          email: emailVerified ? (email ?? existing.email) : existing.email,
          name: name ?? existing.name,
          avatarUrl: avatarUrl ?? existing.avatarUrl,
          lastLoginAt: new Date(),
        })
        .where(eq(publicUsers.id, userId));
    }

    // 3) crear sesión
    const ttlDays = Number(process.env.PUBLIC_SESSION_TTL_DAYS ?? '30');
    const expiresAt = addDays(new Date(), ttlDays);

    const session = await this.db
      .insert(publicSessions)
      .values({
        publicUserId: userId,
        expiresAt,
        userAgent: userAgent ?? null,
        ip: ip ?? null,
      })
      .returning({
        id: publicSessions.id,
        expiresAt: publicSessions.expiresAt,
      });

    return {
      userId,
      sessionId: session[0].id,
      expiresAt: session[0].expiresAt,
    };
  }

  async getUserBySession(sessionId: string) {
    if (!sessionId) return null;

    const row = await this.db
      .select({
        user: publicUsers,
        sessionId: publicSessions.id,
        expiresAt: publicSessions.expiresAt,
      })
      .from(publicSessions)
      .innerJoin(publicUsers, eq(publicSessions.publicUserId, publicUsers.id))
      .where(
        and(
          eq(publicSessions.id, sessionId),
          gt(publicSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!row.length) return null;
    return row[0].user;
  }

  async logout(sessionId: string) {
    if (!sessionId) return;

    await this.db
      .delete(publicSessions)
      .where(eq(publicSessions.id, sessionId));
  }
}
