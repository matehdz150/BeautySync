export class PublicSession {
  constructor(
    public id: string,
    public publicUserId: string,
    public expiresAt: Date,
  ) {}
}
