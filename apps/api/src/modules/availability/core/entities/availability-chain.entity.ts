export class ChainAssignment {
  constructor(
    public serviceId: string,
    public staffId: string,
    public startIso: string,
    public endIso: string,
    public startLocalIso: string,
    public endLocalIso: string,
    public durationMin: number,
  ) {}
}

export class ChainPlan {
  constructor(
    public startIso: string,
    public startLocalIso: string,
    public startLocalLabel: string,
    public assignments: ChainAssignment[],
  ) {}
}

export type ChainStep =
  | { serviceId: string; staffId: string }
  | { serviceId: string; staffId: 'ANY' };
