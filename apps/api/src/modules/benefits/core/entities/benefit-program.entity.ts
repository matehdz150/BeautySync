export class BenefitProgram {
  constructor(
    public readonly id: string,
    public readonly branchId: string,
    public isActive: boolean,
    public name?: string,
  ) {}
}
