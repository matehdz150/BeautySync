import { Branch } from '../entities/branch.entity';

export interface CreateBranchInput {
  organizationId: string;
  name: string;
  address?: string | null;
  lat?: number;
  lng?: number;
}

export interface UpdateBranchLocationInput {
  address?: string;
  lat: number;
  lng: number;
  isLocationVerified?: boolean;
}

export interface UpdateBranchInput {
  name?: string;
  address?: string;
  description?: string;
}

export interface BranchesRepository {
  findAll(): Promise<Branch[]>;

  findByOrg(orgId: string): Promise<Branch[]>;

  create(data: CreateBranchInput): Promise<Branch>;

  findBranchByUser(userId: string): Promise<{
    branch: Branch | null;
    reason?: string;
  }>;

  updateLocation(
    branchId: string,
    dto: UpdateBranchLocationInput,
  ): Promise<Branch>;

  updateBranch(branchId: string, dto: UpdateBranchInput): Promise<Branch>;

  getBasic(branchId: string): Promise<{
    id: string;
    name: string;
    address: string | null;
    description: string | null;
  }>;

  getBranchForAi(branchId: string): Promise<{
    branch: Branch;
    services: { name: string }[];
  }>;

  findById(branchId: string): Promise<Branch | null>;
}
