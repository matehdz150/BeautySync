export interface BranchesRepositoryPort {
  findById(id: string): Promise<{
    id: string;
    organizationId: string;
  } | null>;
}
