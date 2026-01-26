import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { db } from 'src/modules/db/client';
import { branchImages } from 'src/modules/db/schema';
import { branches } from 'src/modules/db/schema';
import { eq, and } from 'drizzle-orm';
import * as client from 'src/modules/db/client';

@Injectable()
export class BranchImagesService {
  constructor(@Inject('DB') private db: client.DB) {}
  /* =====================
     GET IMAGES
  ===================== */
  async getByBranch(branchId: string) {
    return db.query.branchImages.findMany({
      where: eq(branchImages.branchId, branchId),
      orderBy: (img, { asc }) => asc(img.position),
    });
  }

  /* =====================
     ADD IMAGE
  ===================== */
  async addImage(
    branchId: string,
    input: {
      url: string;
      publicId: string;
      isCover?: boolean;
    },
  ) {
    const branch = await db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branch) throw new BadRequestException('Branch not found');

    // si es cover, quitar otros cover
    if (input.isCover) {
      await db
        .update(branchImages)
        .set({ isCover: false })
        .where(eq(branchImages.branchId, branchId));
    }

    const last = await db.query.branchImages.findFirst({
      where: eq(branchImages.branchId, branchId),
      orderBy: (img, { desc }) => desc(img.position),
    });

    const position = last ? last.position + 1 : 0;

    const [created] = await db
      .insert(branchImages)
      .values({
        branchId,
        url: input.url,
        publicId: input.publicId,
        isCover: input.isCover ?? false,
        position,
      })
      .returning();

    return created;
  }

  /* =====================
     UPDATE IMAGE
  ===================== */
  async updateImage(
    branchId: string,
    imageId: string,
    data: {
      isCover?: boolean;
      position?: number;
    },
  ) {
    if (data.isCover) {
      await db
        .update(branchImages)
        .set({ isCover: false })
        .where(eq(branchImages.branchId, branchId));
    }

    const [updated] = await db
      .update(branchImages)
      .set(data)
      .where(
        and(eq(branchImages.id, imageId), eq(branchImages.branchId, branchId)),
      )
      .returning();

    return updated;
  }

  /* =====================
     DELETE IMAGE
  ===================== */
  async deleteImage(branchId: string, imageId: string) {
    const [deleted] = await db
      .delete(branchImages)
      .where(
        and(eq(branchImages.id, imageId), eq(branchImages.branchId, branchId)),
      )
      .returning();

    return deleted;
  }
}
