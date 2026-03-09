import { BranchImage } from '../../core/entities/branch-image.entity';
import { branchImages } from 'src/modules/db/schema/branches/branchImages';

type BranchImageRow = typeof branchImages.$inferSelect;

export class BranchImageMapper {
  static toDomain(this: void, row: BranchImageRow): BranchImage {
    return new BranchImage(
      row.id,
      row.branchId,
      row.url,
      row.publicId,
      row.isCover,
      row.position,
      row.createdAt,
    );
  }
}
