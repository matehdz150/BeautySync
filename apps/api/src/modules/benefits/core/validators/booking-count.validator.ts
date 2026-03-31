import { BadRequestException, Injectable } from '@nestjs/common';
import { BenefitRuleConfigValidator } from './benefit-rule-config.validator.interface';
import { BenefitEarnRuleType } from '../engine/benefit-rule-handler.interface';

@Injectable()
export class BookingCountConfigValidator implements BenefitRuleConfigValidator {
  supports(type: BenefitEarnRuleType) {
    return type === 'BOOKING_COUNT';
  }

  validate(config: unknown) {
    if (!this.isValid(config)) {
      throw new BadRequestException('Invalid BOOKING_COUNT config');
    }

    return config;
  }

  private isValid(
    config: unknown,
  ): config is { count: number; points: number } {
    if (typeof config !== 'object' || config === null) return false;

    const c = config as Record<string, unknown>;

    return typeof c.count === 'number' && typeof c.points === 'number';
  }
}
