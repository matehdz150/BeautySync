import { PublicBranch } from '../entities/public-branch.entity';

export interface PublicBranchesRepository {
  getBySlug(slug: string): Promise<PublicBranch>;
}
