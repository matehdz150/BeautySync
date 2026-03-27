export type BranchSearchItem = {
  id: string;
  name: string;
  address: string;
  ratingAvg: number;
  lat?: number;
  lng?: number;
};

export type ServiceSearchItem = {
  id: string;
  name: string;
  durationMin: number;
};

export type StaffSearchItem = {
  id: string;
  name: string;
  role?: string;
};
