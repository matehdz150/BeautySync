import { publicFetch, PublicStaff } from "./apiPublic";

export function getPublicStaffForService({
  slug,
  serviceId,
}: {
  slug: string;
  serviceId: string;
}): Promise<PublicStaff[]> {
  return publicFetch(
    `/public/${slug}/services/${serviceId}/staff`
  );
}