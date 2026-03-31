export interface BenefitTransactionManager {
  runInTransaction<T>(cb: () => Promise<T>): Promise<T>;
}
