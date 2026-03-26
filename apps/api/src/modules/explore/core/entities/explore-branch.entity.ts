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

  servicesPreview: {
    name: string;
    priceCents?: number;
    durationMin: number;
  }[];
};
