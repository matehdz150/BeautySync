"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { usePublicBooking } from "@/context/PublicBookingContext";
import { getPublicServicesByBranchSlug } from "@/lib/services/public/services";

const STEP_ROUTES = ["services", "staff", "datetime", "confirm"] as const;

export type BookingLayoutRenderProps = {
  children: React.ReactNode;

  selectedServicesCount: number;
  isContinueDisabled: boolean;
  formattedTotal: string;
  canContinue: boolean;
  isConfirmStep: boolean;

  handleContinue: () => void;
};

export function BookingLayoutBase({
  children,
  render,
}: {
  children: React.ReactNode;
  render: (props: BookingLayoutRenderProps) => React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    branch,
    services: selectedServices,
    catalog,
    step,
    canContinue,
    staffByService,
    dispatch,
  } = usePublicBooking();

  /* =====================
     REDIRECT IF CONTEXT LOST
  ===================== */

  const parts = pathname.split("/").filter(Boolean);
  const branchSlug = parts[1]; // /book/{slug}/...

  useEffect(() => {
    if (!branch && branchSlug && pathname !== `/book/${branchSlug}`) {
      router.replace(`/book/${branchSlug}`);
    }
  }, [branch, branchSlug, pathname, router]);

  /* =====================
   WARN BEFORE REFRESH
===================== */

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      // solo si hay datos en la reserva
      if (!selectedServices.length) return;

      e.preventDefault();
      e.returnValue =
        "Si actualizas la página se perderán los datos de tu reservación.";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [selectedServices.length]);

  /* =====================
     BASE PATH
  ===================== */

  const basePath = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];

    if (STEP_ROUTES.includes(last as any)) {
      return "/" + parts.slice(0, -1).join("/");
    }

    return "/" + parts.join("/");
  }, [pathname]);

  /* =====================
     CURRENT STEP KEY
  ===================== */

  const currentStepKey = useMemo(() => {
    const last = pathname.split("/").filter(Boolean).pop();

    return STEP_ROUTES.includes(last as any)
      ? (last as (typeof STEP_ROUTES)[number])
      : null;
  }, [pathname]);

  /* =====================
     SYNC STEP WITH ROUTE
  ===================== */

  useEffect(() => {
    const idx = STEP_ROUTES.findIndex((r) => pathname.endsWith("/" + r));
    if (idx === -1) return;

    const stepFromRoute = idx + 1;

    if (step !== stepFromRoute) {
      dispatch({ type: "SET_STEP", payload: stepFromRoute });
    }
  }, [pathname, step, dispatch]);

  /* =====================
     LOAD CATALOG ONCE
  ===================== */

  useEffect(() => {
    if (!branch?.slug) return;
    if (catalog.length > 0) return;

    dispatch({ type: "START_LOADING" });

    getPublicServicesByBranchSlug(branch.slug)
      .then((data) => dispatch({ type: "SET_CATALOG", payload: data }))
      .catch((err) => dispatch({ type: "SET_ERROR", payload: err.message }));
  }, [branch?.slug, catalog.length, dispatch]);

  /* =====================
     SUMMARY DATA
  ===================== */

  const selectedRows = useMemo(() => {
    if (!catalog.length) return [];

    return selectedServices
      .map((id) => catalog.find((s) => s.id === id))
      .filter(Boolean);
  }, [selectedServices, catalog]);

  const totalCents = useMemo(() => {
    return selectedRows.reduce((acc, s) => acc + (s?.priceCents ?? 0), 0);
  }, [selectedRows]);

  const formattedTotal =
    totalCents > 0 ? `$${Math.round(totalCents / 100)} MXN` : "$0 MXN";

  /* =====================
     STAFF VALIDATION
  ===================== */

  const isStaffSelectionComplete = useMemo(() => {
    if (!selectedServices.length) return false;

    return selectedServices.every((serviceId) => {
      const staffId = staffByService?.[serviceId];
      return typeof staffId === "string" && staffId.length > 0;
    });
  }, [selectedServices, staffByService]);

  const isContinueDisabled = useMemo(() => {
    if (!canContinue) return true;

    if (currentStepKey === "staff") {
      return !isStaffSelectionComplete;
    }

    return false;
  }, [canContinue, currentStepKey, isStaffSelectionComplete]);

  /* =====================
     NAVIGATION
  ===================== */

  function handleContinue() {
    if (!canContinue) return;
    if (isContinueDisabled) return;

    const nextStep = step + 1;
    const nextStepKey = STEP_ROUTES[nextStep - 1];
    if (!nextStepKey) return;

    dispatch({ type: "NEXT_STEP" });
    router.push(`${basePath}/${nextStepKey}`);
  }

  const isConfirmStep = pathname.endsWith("/confirm");

  return render({
    children,
    selectedServicesCount: selectedServices.length,
    formattedTotal,
    canContinue,
    isConfirmStep,
    isContinueDisabled,
    handleContinue,
  });
}
