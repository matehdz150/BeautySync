import { BadRequestException, Injectable } from '@nestjs/common';
import { BenefitEarnRuleType } from '../engine/benefit-rule-handler.interface';
import { BenefitRuleConfigValidator } from './benefit-rule-config.validator.interface';

@Injectable()
export class SpendAccumulatedConfigValidator implements BenefitRuleConfigValidator {
  supports(type: BenefitEarnRuleType) {
    return type === 'SPEND_ACCUMULATED';
  }

  validate(config: unknown) {
    if (!this.isValid(config)) {
      throw new BadRequestException('Invalid SPEND_ACCUMULATED config');
    }

    return config;
  }

  private isValid(
    config: unknown,
  ): config is { thresholdCents: number; points: number } {
    if (typeof config !== 'object' || config === null) return false;

    const c = config as Record<string, unknown>;

    return typeof c.thresholdCents === 'number' && typeof c.points === 'number';
  }
}
