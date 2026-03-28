export interface StaffRepositoryPort {
  findById(id: string): Promise<{
    id: string;
    email: string | null;
    branchId: string;
    name: string;
    avatarUrl: string | null;
  } | null>;

  linkUser(staffId: string, userId: string): Promise<void>;
}
