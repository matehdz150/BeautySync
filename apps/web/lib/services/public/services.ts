import { publicFetch, PublicService } from "./apiPublic";

export type ServiceCategory = {
  id: string;
  name: string;
  icon: string;
  hexColor: string;
};


export function getPublicServicesByBranchSlug(
  slug: string
): Promise<PublicService[]> {
  return publicFetch(
    `/public/${slug}/services`
  );
}

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/public/service-categories`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch service categories");
  }

  return res.json();
}