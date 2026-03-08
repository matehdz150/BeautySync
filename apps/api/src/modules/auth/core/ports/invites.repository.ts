export interface StaffInvite {
  id: string;
  token: string;
  email: string;
  role: string;
  staffId: string;
  expiresAt: Date;
  accepted: boolean;
}

export interface InvitesRepositoryPort {
  findByToken(token: string): Promise<StaffInvite | null>;
  markAccepted(inviteId: string): Promise<void>;
}
