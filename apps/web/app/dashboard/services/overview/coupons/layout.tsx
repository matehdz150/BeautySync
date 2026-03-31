"use client";

import { CouponDraftProvider } from "@/context/CouponDraftContext";
import { useBranch } from "@/context/BranchContext";
import CouponsPage from "./page";

export default function CouponsClientWrapper() {
  const { branch } = useBranch();

  if (!branch) return null;

  return (
    <CouponDraftProvider branchId={branch.id}>
      <CouponsPage />
    </CouponDraftProvider>
  );
}
