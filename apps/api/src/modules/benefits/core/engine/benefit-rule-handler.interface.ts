import { ProcessRuleInput } from './ types';
import { benefitEarnRuleTypeEnum } from 'src/modules/db/schema';

export type BenefitEarnRuleType =
  (typeof benefitEarnRuleTypeEnum.enumValues)[number];

export interface BenefitRuleHandler {
  supports(type: BenefitEarnRuleType): boolean;

  process(input: ProcessRuleInput): Promise<void>;
}
