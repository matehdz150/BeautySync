// lib/services/explore.ts

import { graphqlFetch } from "./graphql";

export type ExploreFilters = {
  lat?: number;
  lng?: number;
  radius?: number;

  categories?: string;
  minPrice?: number;
  maxPrice?: number;

  rating?: number;
  sort?: "distance" | "rating" | "price";
};

export type ExploreBranch = {
  id: string;
  name: string;
  publicSlug?: string;
  address?: string;
  lat?: number;
  lng?: number;
  coverImage?: string;

  ratingAvg: number;
  ratingCount: number;

  servicesCount: number;

  servicesPreview: {
    name: string;
    priceCents?: number;
    durationMin: number;
    categoryName?: string; // 👈 nuevo
  }[];

  distanceKm?: number; // 👈 nuevo
};

export async function getExploreBranches(filters?: ExploreFilters) {
  const data = await graphqlFetch<{
    exploreBranches: ExploreBranch[];
  }>(
    `
    query ExploreBranches($filters: ExploreFiltersInput) {
      exploreBranches(filters: $filters) {
        id
        name
        publicSlug
        address
        lat
        lng
        coverImage

        ratingAvg
        ratingCount

        servicesCount

        distanceKm

        servicesPreview {
          name
          priceCents
          durationMin
          categoryName
        }
      }
    }
  `,
    {
      filters,
    }
  );

  return data.exploreBranches;
}
