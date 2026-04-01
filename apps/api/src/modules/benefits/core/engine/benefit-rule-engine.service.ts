import { Inject, Injectable } from '@nestjs/common';
import { BenefitRuleHandler } from './benefit-rule-handler.interface';
import { ProcessRuleInput } from './types';
import { BENEFIT_RULE_HANDLERS } from '../ports/tokens';

@Injectable()
export class BenefitRuleEngine {
  constructor(
    @Inject(BENEFIT_RULE_HANDLERS)
    private readonly handlers: BenefitRuleHandler[],
  ) {}

  async processRules(inputs: ProcessRuleInput[]) {
    for (const input of inputs) {
      const handler = this.handlers.find((h) => h.supports(input.rule.type));

      if (!handler) continue;

      await handler.process(input);
    }
  }
}
