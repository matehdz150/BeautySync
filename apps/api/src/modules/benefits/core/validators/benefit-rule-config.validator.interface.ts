import { BenefitEarnRuleType } from '../engine/benefit-rule-handler.interface';
export type BenefitRuleConfig =
  | { count: number; points: number }
  | { thresholdCents: number; points: number }
  | { points: number };

export interface BenefitRuleConfigValidator {
  supports(type: BenefitEarnRuleType): boolean;

  validate(config: unknown): BenefitRuleConfig;
}
