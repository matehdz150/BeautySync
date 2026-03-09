export class Branch {
  constructor(
    public id: string,
    public organizationId: string,
    public name: string,
    public address: string | null,
    public description: string | null,
    public lat: string | null,
    public lng: string | null,
    public isLocationVerified: boolean,
    public publicPresenceEnabled: boolean,
    public publicSlug: string | null,
  ) {}
}
