import { Inject, Injectable } from '@nestjs/common';
import { BenefitTransactionManager } from '../../core/ports/benefit-transactiont-manager.repository';
import { DB } from 'src/modules/db/client';

@Injectable()
export class DrizzleTransactionManager implements BenefitTransactionManager {
  constructor(@Inject('DB') private readonly db: DB) {}

  async runInTransaction<T>(cb: () => Promise<T>): Promise<T> {
    return this.db.transaction(async () => {
      return cb();
    });
  }
}
