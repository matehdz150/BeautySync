import {
  BranchSearchItem,
  ServiceSearchItem,
  StaffSearchItem,
} from '../entities/global-search.entity';

export type Cursor = {
  score: number;
  id: string;
};

export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
};

export interface GlobalSearchRepository {
  // 🔥 recommendations
  getRecommendedBranches(params: {
    limit: number;
    lat?: number;
    lng?: number;
  }): Promise<BranchSearchItem[]>;

  getRecommendedServices(limit: number): Promise<ServiceSearchItem[]>;

  getRecommendedStaff(limit: number): Promise<StaffSearchItem[]>;

  // 🔥 cursor-based search
  searchBranches(params: {
    query: string;
    limit: number;
    cursor?: Cursor;
    lat?: number;
    lng?: number;
  }): Promise<Paginated<BranchSearchItem>>;

  searchServices(params: {
    query: string;
    limit: number;
    cursor?: Cursor;
  }): Promise<Paginated<ServiceSearchItem>>;

  searchStaff(params: {
    query: string;
    limit: number;
    cursor?: Cursor;
  }): Promise<Paginated<StaffSearchItem>>;
}

export type GlobalSearchResult = {
  branches?: Paginated<BranchSearchItem>;
  services?: Paginated<ServiceSearchItem>;
  staff?: Paginated<StaffSearchItem>;
};
