import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import type { DB } from 'src/modules/db/client';

import { staff } from 'src/modules/db/schema';

import { StaffRepositoryPort } from '../../core/ports/staff.repository';

@Injectable()
export class StaffDrizzleRepository implements StaffRepositoryPort {
  constructor(@Inject('DB') private readonly db: DB) {}

  async findById(id: string): Promise<{
    id: string;
    email: string | null;
    branchId: string;
  } | null> {
    const row = await this.db.query.staff.findFirst({
      where: eq(staff.id, id),
      columns: {
        id: true,
        email: true,
        branchId: true,
      },
    });

    if (!row) return null;

    return row;
  }

  async linkUser(staffId: string, userId: string): Promise<void> {
    await this.db
      .update(staff)
      .set({
        userId,
        status: 'active',
      })
      .where(eq(staff.id, staffId));
  }
}
