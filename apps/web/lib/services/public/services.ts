import { publicFetch, PublicService } from "./apiPublic";

export function getPublicServicesByBranchSlug(
  slug: string
): Promise<PublicService[]> {
  return publicFetch(
    `/public/${slug}/services`
  );
}