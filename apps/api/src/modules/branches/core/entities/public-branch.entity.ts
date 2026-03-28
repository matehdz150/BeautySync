export interface PublicBranch {
  id: string;
  name: string;
  address: string | null;
  slug: string | null;
  lat: string | null;
  lng: string | null;
  description: string | null;

  rating: {
    average: number | null;
    count: number;
    reviews: {
      id: string;
      rating: number;
      comment: string | null;
      createdAt: string | null;
    }[];
  };

  images: {
    id: string;
    url: string;
    isCover: boolean;
  }[];

  services: {
    id: string;
    name: string;
    description: string | null;
    durationMin: number;
    priceCents: number | null;
    category: {
      id: string;
      name: string;
      icon: string | null;
      hexColor: string | null;
    } | null;
  }[];
}

export interface PublicBranchSummary {
  id: string;
  name: string;
  address: string | null;
  slug: string | null;
  lat: string | null;
  lng: string | null;

  coverUrl: string | null;

  rating: {
    average: number | null;
    count: number;
  };
}
