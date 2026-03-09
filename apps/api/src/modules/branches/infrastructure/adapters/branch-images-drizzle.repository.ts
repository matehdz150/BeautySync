import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  BranchImagesRepository,
  CreateBranchImageInput,
  UpdateBranchImageInput,
} from '../../core/ports/branch-images.repository';
import { and, eq } from 'drizzle-orm';
import { branchImages } from 'src/modules/db/schema/branches/branchImages';
import { branches } from 'src/modules/db/schema/branches/branches';
import * as client from 'src/modules/db/client';
import { BranchImage } from '../../core/entities/branch-image.entity';
import { BranchImageMapper } from '../mappers/branch-image.mapper';

@Injectable()
export class BranchImagesDrizzleRepository implements BranchImagesRepository {
  constructor(@Inject('DB') private db: client.DB) {}

  async getByBranch(branchId: string): Promise<BranchImage[]> {
    const rows = await this.db.query.branchImages.findMany({
      where: eq(branchImages.branchId, branchId),
      orderBy: (img, { asc }) => asc(img.position),
    });

    return rows.map(BranchImageMapper.toDomain);
  }

  async addImage(
    branchId: string,
    input: CreateBranchImageInput,
  ): Promise<BranchImage> {
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    if (input.isCover) {
      await this.db
        .update(branchImages)
        .set({ isCover: false })
        .where(eq(branchImages.branchId, branchId));
    }

    const last = await this.db.query.branchImages.findFirst({
      where: eq(branchImages.branchId, branchId),
      orderBy: (img, { desc }) => desc(img.position),
    });

    const position = last ? last.position + 1 : 0;

    const [created] = await this.db
      .insert(branchImages)
      .values({
        branchId,
        url: input.url,
        publicId: input.publicId,
        isCover: input.isCover ?? false,
        position,
      })
      .returning();

    return BranchImageMapper.toDomain(created);
  }

  async updateImage(
    branchId: string,
    imageId: string,
    data: UpdateBranchImageInput,
  ): Promise<BranchImage> {
    if (data.isCover) {
      await this.db
        .update(branchImages)
        .set({ isCover: false })
        .where(eq(branchImages.branchId, branchId));
    }

    const [updated] = await this.db
      .update(branchImages)
      .set(data)
      .where(
        and(eq(branchImages.id, imageId), eq(branchImages.branchId, branchId)),
      )
      .returning();

    return BranchImageMapper.toDomain(updated);
  }

  async deleteImage(branchId: string, imageId: string): Promise<BranchImage> {
    const [deleted] = await this.db
      .delete(branchImages)
      .where(
        and(eq(branchImages.id, imageId), eq(branchImages.branchId, branchId)),
      )
      .returning();

    return BranchImageMapper.toDomain(deleted);
  }
}
