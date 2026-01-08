import { Inject, Injectable } from '@nestjs/common';
import * as client from 'src/db/client';
import { branches, staff } from 'src/db/schema';
import { eq } from 'drizzle-orm';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchesService {
  constructor(@Inject('DB') private db: client.DB) {}

  findAll() {
    return this.db.select().from(branches);
  }

  findByOrg(orgId: string) {
    return this.db.query.branches.findMany({
      where: eq(branches.organizationId, orgId),
    });
  }

  async create(data: CreateBranchDto) {
    const [branch] = await this.db
      .insert(branches)
      .values({
        organizationId: data.organizationId,
        name: data.name,
        address: data.address,
      })
      .returning();

    return branch;
  }

  async findBranchByUser(userId: string) {
    // buscar si es staff
    const staffMember = await this.db.query.staff.findFirst({
      where: eq(staff.userId, userId),
    });

    if (!staffMember) {
      return {
        branch: null,
        reason: 'USER_NOT_STAFF',
      };
    }

    // buscar branch
    const branchResult = await this.db.query.branches.findFirst({
      where: eq(branches.id, staffMember.branchId),
    });

    return {
      branch: branchResult,
    };
  }
}
