import { BadRequestException, Injectable } from '@nestjs/common';
import { BenefitRuleConfigValidator } from './benefit-rule-config.validator.interface';
import { BenefitEarnRuleType } from '../engine/benefit-rule-handler.interface';

@Injectable()
export class ReviewCreatedConfigValidator implements BenefitRuleConfigValidator {
  supports(type: BenefitEarnRuleType) {
    return type === 'REVIEW_CREATED';
  }

  validate(config: unknown) {
    if (!this.isValid(config)) {
      throw new BadRequestException('Invalid REVIEW_CREATED config');
    }

    return config;
  }

  private isValid(config: unknown): config is { points: number } {
    if (typeof config !== 'object' || config === null) return false;

    const c = config as Record<string, unknown>;

    return typeof c.points === 'number';
  }
}
