export class PublicUser {
  constructor(
    public id: string,
    public email: string | null,
    public googleSub: string | null,
    public name: string | null,
    public avatarUrl: string | null,
  ) {}
}
