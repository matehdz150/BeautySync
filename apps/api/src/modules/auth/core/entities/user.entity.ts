export class User {
  constructor(
    public id: string,
    public email: string,
    public passwordHash: string,
    public role: string,
    public organizationId?: string | null,
  ) {}

  needsOnboarding() {
    return this.role === 'owner' && !this.organizationId;
  }
}

export type LoginResult = {
  user: {
    id: string;
    email: string;
    role: string;
    organizationId: string | null;
    needsOnboarding: boolean;
  };
};
