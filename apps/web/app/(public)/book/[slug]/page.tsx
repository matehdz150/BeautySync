"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { getPublicBranchBySlug } from "@/lib/services/publicPresence";
import { usePublicBooking } from "@/context/PublicBookingContext";
import NotFound from "./NotFoundPage";
import PublicBusinessPage from "./PublicBusinessPage";
import PublicBusinessMobilePage from "./PublicBussinessPageMobile";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Page() {
  const { slug } = useParams<{ slug: string }>();
  const { dispatch, branch, loading } = usePublicBooking();
  const isMobile = useIsMobile(); // (la versión pro que te pasé)

  useEffect(() => {
    if (!slug || branch) return;

    dispatch({ type: "START_LOADING" });

    getPublicBranchBySlug(slug)
      .then((data) => {
        dispatch({ type: "SET_BRANCH", payload: data });
      })
      .catch((err) => {
        dispatch({ type: "SET_ERROR", payload: err.message });
      });
  }, [slug, branch, dispatch]);

  if (loading || !branch) return <NotFound />;

  // 🔥 evita flicker
  if (isMobile === null) return null;

  return isMobile ? <PublicBusinessMobilePage /> : <PublicBusinessPage />;
}