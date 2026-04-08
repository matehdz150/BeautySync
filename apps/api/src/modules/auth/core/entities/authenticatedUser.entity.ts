export class AuthenticatedUser {
  constructor(
    public readonly id: string,
    public readonly role: string,
    public readonly orgId: string | null,
    public readonly branchIds: string[] = [],
  ) {}

  isOwner() {
    return this.role === 'owner';
  }

  isAdmin() {
    return this.role === 'admin';
  }

  belongsToOrg(orgId: string) {
    return this.orgId === orgId;
  }

  hasBranchAccess(branchId: string) {
    return this.branchIds.includes(branchId);
  }
}
