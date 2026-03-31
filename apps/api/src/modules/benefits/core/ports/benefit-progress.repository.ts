// core/ports/benefit-progress.repository.ts
export interface BenefitProgress {
  progressValue: number;
  lastTriggeredAt?: Date;
}

export interface BenefitProgressRepository {
  getProgress(input: {
    userId: string;
    ruleId: string;
  }): Promise<BenefitProgress>;

  incrementProgress(params: {
    userId: string;
    ruleId: string;
    value: number;
  }): Promise<void>;

  resetProgress(params: { userId: string; ruleId: string }): Promise<void>;
}
