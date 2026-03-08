import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { branches } from 'src/modules/db/schema';
import type { DB } from 'src/modules/db/client';

import { BranchesRepositoryPort } from '../../core/ports/branches.repository';

@Injectable()
export class BranchesDrizzleRepository implements BranchesRepositoryPort {
  constructor(@Inject('DB') private readonly db: DB) {}

  async findById(id: string) {
    const row = await this.db.query.branches.findFirst({
      where: eq(branches.id, id),
      columns: {
        id: true,
        organizationId: true,
      },
    });

    if (!row) return null;

    return {
      id: row.id,
      organizationId: row.organizationId,
    };
  }
}
