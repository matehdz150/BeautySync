// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type StaffChoice = string | 'ANY';

export type ChainItem = {
  serviceId: string;
  staffId: StaffChoice;
};

export type ManagerChainBaseDto = {
  branchId: string;
  date: string; // YYYY-MM-DD
  pinnedStartIso: string; // ISO (local o utc, pero consistente con tu app)
  chain: ChainItem[];
};

export type ManagerChainNextServicesDto = ManagerChainBaseDto;

export type ManagerChainNextStaffOptionsDto = ManagerChainBaseDto & {
  nextServiceId: string;
};

export type ManagerChainBuildDto = ManagerChainBaseDto;

export type ManagerChainNextServicesResponse = {
  ok: true;
  nextServices: {
    id: string;
    name: string;
    durationMin: number;
    priceCents: number;
    categoryColor: string | null;
  }[];
};

export type ManagerChainNextStaffOptionsResponse = {
  ok: true;
  allowAny: boolean;
  staff: { id: string; name: string; avatarUrl?: string | null }[];
};

export type ManagerChainBuildResponse = {
  ok: true;
  plan: {
    startIso: string;
    assignments: {
      serviceId: string;
      staffId: string; // ya resuelto
      startIso: string;
      endIso: string;
      durationMin: number;
      priceCents: number;
    }[];
    totalMinutes: number;
    totalCents: number;
  };
};
