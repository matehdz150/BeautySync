import { BenefitEarnRuleEntity } from '../../core/entities/benefit-rule.entity';
import { BenefitEarnRuleType } from '../../core/engine/benefit-rule-handler.interface';

export function createBenefitEarnRuleEntity(data: {
  id: string;
  programId: string;
  type: BenefitEarnRuleType;
  isActive: boolean;
  config: Record<string, unknown>;
}): BenefitEarnRuleEntity {
  return {
    ...data,

    isValid() {
      if (!data.isActive) return false;

      switch (data.type) {
        case 'BOOKING_COUNT':
          return (
            typeof data.config?.count === 'number' &&
            typeof data.config?.points === 'number'
          );

        case 'SPEND_ACCUMULATED':
          return (
            typeof data.config?.thresholdCents === 'number' &&
            typeof data.config?.points === 'number'
          );

        case 'REVIEW_CREATED':
          return typeof data.config?.points === 'number';

        case 'ONLINE_PAYMENT':
          return typeof data.config?.points === 'number';

        default:
          return false;
      }
    },
  };
}
