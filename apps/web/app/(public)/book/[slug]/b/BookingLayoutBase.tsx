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

    // para cada servicio seleccionado, debe existir staffByService[serviceId]
    return selectedServices.every((serviceId) => {
      const staffId = staffByService?.[serviceId];
      return typeof staffId === "string" && staffId.length > 0;
    });
  }, [selectedServices, staffByService]);

  const isContinueDisabled = useMemo(() => {
    // regla base
    if (!canContinue) return true;

    // regla extra SOLO en /staff
    if (currentStepKey === "staff") {
      return !isStaffSelectionComplete;
    }

    return false;
  }, [canContinue, currentStepKey, isStaffSelectionComplete]);

  /* =====================
     NAVIGATION
  ===================== */
  function handleContinue() {
    // 🔥 regla base
    if (!canContinue) return;

    // 🔥 regla extra SOLO en /staff
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
