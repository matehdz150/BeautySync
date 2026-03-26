// lib/services/explore.ts

import { graphqlFetch } from "./graphql";

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
  }[];
};

export async function getExploreBranches() {
  const data = await graphqlFetch<{
    exploreBranches: ExploreBranch[];
  }>(`
    query ExploreBranches {
      exploreBranches {
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
        servicesPreview {
          name
          priceCents
          durationMin
        }
      }
    }
  `);

  return data.exploreBranches;
}