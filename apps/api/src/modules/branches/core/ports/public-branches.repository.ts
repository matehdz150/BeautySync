import {
  PublicBranch,
  PublicBranchSummary,
} from '../entities/public-branch.entity';

export interface PublicBranchesRepository {
  getBySlug(slug: string): Promise<PublicBranch>;
  getSummaryById(id: string): Promise<PublicBranchSummary>;
}
