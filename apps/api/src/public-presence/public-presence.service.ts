import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { branches } from 'src/db/schema';
import { generateUniqueBranchSlug } from 'src/lib/utils';
import * as client from 'src/db/client';

@Injectable()
export class PublicPresenceService {
  constructor(@Inject('DB') private readonly db: client.DB) {}
  /* =============================
     GET STATUS
  ============================= */
  async getStatus(branchId: string) {
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branch) throw new BadRequestException('Branch not found');

    return {
      enabled: branch.publicPresenceEnabled,

      slug: branch.publicSlug,
    };
  }

  //activate

  async activate(branchId: string) {
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branch) throw new BadRequestException('Branch not found');

    // Ya activa → no regeneramos slug

    if (branch.publicPresenceEnabled && branch.publicSlug) {
      return {
        enabled: true,
        slug: branch.publicSlug,
      };
    }

    const slug =
      branch.publicSlug ?? (await generateUniqueBranchSlug(branch.name));

    await this.db
      .update(branches)
      .set({
        publicPresenceEnabled: true,
        publicSlug: slug,
      })
      .where(eq(branches.id, branchId));

    return {
      enabled: true,
      slug,
    };
  }
  /* =============================
     DEACTIVATE
  ============================= */
  async deactivate(branchId: string) {
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branch) throw new BadRequestException('Branch not found');

    await this.db
      .update(branches)
      .set({
        publicPresenceEnabled: false,
      })
      .where(eq(branches.id, branchId));

    return {
      enabled: false,
      slug: branch.publicSlug, // 👈 lo conservamos
    };
  }
}
