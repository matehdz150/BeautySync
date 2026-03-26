import { getExploreBranches } from "@/lib/services/public/explore";
import PageWrapper from "./pageWrapper";

type Props = {
  searchParams: {
    lat?: string;
    lng?: string;
    radius?: string;

    categories?: string;

    minPrice?: string;
    maxPrice?: string;

    rating?: string;
    sort?: "distance" | "rating" | "price";
  };
};

export default async function Page({ searchParams }: Props) {
  const filters = {
    lat: searchParams.lat ? Number(searchParams.lat) : undefined,
    lng: searchParams.lng ? Number(searchParams.lng) : undefined,
    radius: searchParams.radius ? Number(searchParams.radius) : undefined,

    categories: searchParams.categories,

    minPrice: searchParams.minPrice
      ? Number(searchParams.minPrice)
      : undefined,

    maxPrice: searchParams.maxPrice
      ? Number(searchParams.maxPrice)
      : undefined,

    rating: searchParams.rating
      ? Number(searchParams.rating)
      : undefined,

    sort: searchParams.sort,
  };

  const branches = await getExploreBranches(filters);

  return <PageWrapper branches={branches} />;
}