export class Staff {
  constructor(
    public id: string,
    public branchId: string,
    public userId: string | null,
    public name: string,
    public email: string | null,
    public avatarUrl: string | null,
    public jobRole: string | null,
    public status: 'pending' | 'active' | 'disabled',
    public isActive: boolean,
  ) {}
}

export interface StaffDetails {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  jobRole: string | null;
  userId: string | null;
  branchId: string;
  isActive: boolean;

  schedules: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];

  services: string[];
}

export interface StaffListItem {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  jobRole: string | null;
  status: 'pending' | 'active' | 'disabled';
  isActive: boolean;
  schedule: string;
  schedules: {
    id: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  rating: number;

  services: {
    id: string;
    name: string;
    durationMin: number;
    priceCents?: number | null;
  }[];
}

export type StaffWithInvite = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  status: 'pending' | 'active' | 'disabled';
  jobRole: string | null;
  isActive: boolean;

  invite: {
    status: 'pending' | 'accepted' | 'expired';
    expiresAt: string | null;
    createdAt: string | null;
  } | null;
};
