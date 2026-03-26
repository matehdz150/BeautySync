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
  function buildArgs() {
    if (!filters) return "";

    const args: string[] = [];

    if (filters.lat !== undefined) args.push(`lat: ${filters.lat}`);
    if (filters.lng !== undefined) args.push(`lng: ${filters.lng}`);
    if (filters.radius !== undefined) args.push(`radius: ${filters.radius}`);

    if (filters.categories)
      args.push(`categories: "${filters.categories}"`);

    if (filters.minPrice !== undefined)
      args.push(`minPrice: ${filters.minPrice}`);

    if (filters.maxPrice !== undefined)
      args.push(`maxPrice: ${filters.maxPrice}`);

    if (filters.rating !== undefined)
      args.push(`rating: ${filters.rating}`);

    if (filters.sort)
      args.push(`sort: ${filters.sort.toUpperCase()}`);

    return args.length ? `(${args.join(", ")})` : "";
  }

  const query = `
    query {
      exploreBranches${buildArgs()} {
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
  `;

  const data = await graphqlFetch<{
    exploreBranches: ExploreBranch[];
  }>(query);

  return data.exploreBranches;
}
