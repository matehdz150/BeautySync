import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import {
  Staff,
  StaffDetails,
  StaffListItem,
  StaffWithInvite,
} from '../entities/staff.entity';

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

export type StaffInviteInfo = {
  id: string;
  staffId: string;
  email: string;
  role: 'staff' | 'manager';
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
  createdAt: Date;
};

export interface StaffRepository {
  findAll(): Promise<Staff[]>;

  findById(id: string, user?: AuthenticatedUser): Promise<StaffDetails | null>;
  findByBranch(
    branchId: string,
    user: AuthenticatedUser,
  ): Promise<StaffListItem[]>;
  findSnapshotByBranch(branchId: string): Promise<StaffListItem[]>;

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

  findByBranchWithInvites(branchId: string): Promise<StaffWithInvite[]>;
  findLatestInviteByStaffId(staffId: string): Promise<StaffInviteInfo | null>;
  findInactiveByBranch(branchId: string): Promise<Staff[]>;

  activate(staffId: string): Promise<Staff>;
}
