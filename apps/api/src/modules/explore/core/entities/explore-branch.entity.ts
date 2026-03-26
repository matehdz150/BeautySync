export type ExploreBranch = {
  id: string;
  name: string;
  address?: string | null;
  lat?: number;
  lng?: number;
  publicSlug?: string;

  coverImage?: string;

  ratingAvg: number;
  ratingCount: number;

  servicesCount: number;

  distanceKm?: number;

  servicesPreview: {
    name: string;
    priceCents?: number;
    durationMin: number;
  }[];
};

export type ExploreFilters = {
  lat?: number;
  lng?: number;
  radius?: number;

  categories?: string;
  minPrice?: number;
  maxPrice?: number;

  rating?: number;
  sort?: 'distance' | 'rating' | 'price';
};
