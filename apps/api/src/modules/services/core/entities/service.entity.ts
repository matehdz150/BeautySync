// core/entities/service.entity.ts

export class Service {
  constructor(
    public id: string,
    public organizationId: string,
    public branchId: string,
    public categoryId: string | null,
    public name: string,
    public description: string | null,
    public durationMin: number,
    public priceCents: number | null,
    public notes: string[],
    public serviceRules: string[],
    public isActive: boolean,
  ) {}
}
