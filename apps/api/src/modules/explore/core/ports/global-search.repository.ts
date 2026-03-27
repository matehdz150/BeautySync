import {
  BranchSearchItem,
  ServiceSearchItem,
  StaffSearchItem,
} from '../entities/global-search.entity';

export interface GlobalSearchRepository {
  // 🔥 recommendations
  getRecommendedBranches(params: {
    limit: number;
    lat?: number;
    lng?: number;
  }): Promise<BranchSearchItem[]>;

  getRecommendedServices(limit: number): Promise<ServiceSearchItem[]>;

  getRecommendedStaff(limit: number): Promise<StaffSearchItem[]>;

  // 🔥 search
  searchBranches(params: {
    query: string;
    limit: number;
    lat?: number;
    lng?: number;
  }): Promise<BranchSearchItem[]>;

  searchServices(query: string, limit: number): Promise<ServiceSearchItem[]>;

  searchStaff(query: string, limit: number): Promise<StaffSearchItem[]>;
}

export type GlobalSearchResult = {
  branches: any[];
  services: any[];
  staff: any[];
};
