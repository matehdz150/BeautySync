export class User {
  constructor(
    public id: string,
    public email: string,
    public name: string | null,
    public organizationId: string | null,
    public role: string,
    public avatarUrl: string | null,
  ) {}
}
