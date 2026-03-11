import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import { Staff, StaffDetails, StaffListItem } from '../entities/staff.entity';

export interface CreateStaffInput {
  branchId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  jobRole?: string;
}

export interface UpdateStaffInput {
  name?: string;
  email?: string;
  avatarUrl?: string;
  jobRole?: string;
}

export interface StaffRepository {
  findAll(): Promise<Staff[]>;

  findById(id: string, user: AuthenticatedUser): Promise<StaffDetails | null>;
  findByBranch(
    branchId: string,
    user: AuthenticatedUser,
  ): Promise<StaffListItem[]>;

  create(data: CreateStaffInput): Promise<Staff>;

  update(
    id: string,
    data: UpdateStaffInput,
    user: AuthenticatedUser,
  ): Promise<Staff>;

  delete(id: string): Promise<Staff>;

  findFiltered(params: {
    branchId: string;
    serviceId?: string;
    user: AuthenticatedUser;
  }): Promise<any[]>;

  inviteStaff(
    email: string,
    staffId: string,
    role: 'staff' | 'manager',
    user: AuthenticatedUser,
  ): Promise<{ ok: boolean }>;

  reinviteStaff(staffId: string): Promise<{ ok: boolean }>;
}
