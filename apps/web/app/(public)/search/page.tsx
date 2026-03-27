"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import ExploreMobile from "@/components/Explore/search/mobile/ExploreMobile";
import PageWrapper from "./pageWrapper";
import { ExploreFiltersProvider } from "@/context/public/ExploreFiltersContext";

export default function PageClient({ branches }: any) {
  const isMobile = useIsMobile();

  if (isMobile === null) return null;

  // 🔥 MOBILE
  if (isMobile) {
    return <>
    <ExploreFiltersProvider>
      <ExploreMobile initialBranches={branches} />
    </ExploreFiltersProvider>
    </>;
  }

  // 🔥 DESKTOP
  return <PageWrapper branches={branches ?? []} />;
}