export interface ServicePublicRepository {
  getServicesByBranchSlug(slug: string): Promise<
    {
      id: string;
      name: string;
      durationMin: number;
      priceCents: number | null;

      category: {
        id: string;
        name: string;
        icon: string;
        hexColor: string;
      } | null;
    }[]
  >;

  getStaffForService(params: { slug: string; serviceId: string }): Promise<
    {
      id: string;
      name: string;
      avatarUrl: string | null;
    }[]
  >;
}

export type PublicServiceItem = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number | null;

  category: {
    id: string;
    name: string;
    icon: string;
    hexColor: string;
  } | null;
};
