// core/entities/benefit-rule.entity.ts

export type BenefitRuleType =
  | 'BOOKING_COUNT'
  | 'SPEND_ACCUMULATED'
  | 'REVIEW_CREATED'
  | 'ONLINE_PAYMENT';

export class BenefitEarnRuleEntity {
  constructor(
    public readonly id: string,
    public readonly programId: string,
    public readonly type: BenefitRuleType,
    public readonly isActive: boolean,
    public readonly config: any,
  ) {}

  isValid(): boolean {
    return this.isActive;
  }
}
