export type AvailabilityChainRequestCore = {
  branchId: string;
  date: string; // YYYY-MM-DD
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  chain: { serviceId: string; staffId: string | 'ANY' }[];
};

export type AvailabilityChainAssignment = {
  serviceId: string;
  staffId: string;

  // UTC (source of truth)
  startIso: string;
  endIso: string;

  // Local timezone (for UI)
  startLocalIso: string;
  endLocalIso: string;

  durationMin: number;
};

export type AvailabilityChainPlan = {
  // UTC (source of truth)
  startIso: string;

  // Local timezone (for UI)
  startLocalIso: string;
  startLocalLabel: string; // "10:00"

  assignments: AvailabilityChainAssignment[];
};
