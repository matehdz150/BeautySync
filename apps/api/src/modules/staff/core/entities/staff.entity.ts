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

  services: {
    id: string;
    name: string;
    durationMin: number;
    priceCents?: number | null;
  }[];
}
