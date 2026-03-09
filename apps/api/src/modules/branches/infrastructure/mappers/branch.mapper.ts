import { Branch } from '../../core/entities/branch.entity';
import { branches } from 'src/modules/db/schema';

type BranchRow = typeof branches.$inferSelect;

export class BranchMapper {
  static toDomain(row: BranchRow): Branch {
    return new Branch(
      row.id,
      row.organizationId,
      row.name,
      row.address,
      row.description,
      row.lat,
      row.lng,
      row.isLocationVerified,
      row.publicPresenceEnabled,
      row.publicSlug,
    );
  }
}
