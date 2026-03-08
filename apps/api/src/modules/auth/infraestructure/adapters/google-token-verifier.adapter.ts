import { OAuth2Client } from 'google-auth-library';

export class GoogleTokenVerifierAdapter {
  private client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  async verify(idToken: string) {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Invalid google token');
    }

    return {
      sub: payload.sub,
      email: payload.email ?? null,
      emailVerified: payload.email_verified === true,
      name: payload.name ?? null,
      avatarUrl: payload.picture ?? null,
    };
  }
}
