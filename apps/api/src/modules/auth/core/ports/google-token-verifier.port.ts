export interface GoogleTokenPayload {
  sub: string;
  email?: string | null;
  emailVerified?: boolean;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface GoogleTokenVerifierPort {
  verify(idToken: string): Promise<GoogleTokenPayload>;
}
