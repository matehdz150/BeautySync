"use client";

import { createContext, useContext, useState } from "react";

/* =========================
   TYPES
========================= */

export type CouponDraft = {
  branchId: string;

  code: string;

  type: "percentage" | "fixed";
  value: number;

  minAmountCents?: number;
  maxDiscountCents?: number;

  usageLimit?: number;

  assignedToUserId?: string | null;

  expiresAt?: Date | null;

  serviceIds?: string[];
};

/* =========================
   CONTEXT
========================= */

type ContextType = {
  open: () => void;
  close: () => void;
  isOpen: boolean;

  draft: CouponDraft;
  update: (data: Partial<CouponDraft>) => void;
  reset: () => void;
};

const CouponDraftContext = createContext<ContextType | null>(null);

/* =========================
   DEFAULT STATE
========================= */

const DEFAULT_DRAFT: CouponDraft = {
  branchId: "",

  code: "",

  type: "percentage",
  value: 0,

  minAmountCents: undefined,
  maxDiscountCents: undefined,

  usageLimit: undefined,

  assignedToUserId: null,

  expiresAt: null,

  serviceIds: [],
};

/* =========================
   PROVIDER
========================= */

export function CouponDraftProvider({
  children,
  branchId,
}: {
  children: React.ReactNode;
  branchId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const [draft, setDraft] = useState<CouponDraft>({
    ...DEFAULT_DRAFT,
    branchId,
  });

  function open() {
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  function update(data: Partial<CouponDraft>) {
    setDraft((prev) => ({
      ...prev,
      ...data,
    }));
  }

  function reset() {
    setDraft({
      ...DEFAULT_DRAFT,
      branchId,
    });
  }

  return (
    <CouponDraftContext.Provider
      value={{
        open,
        close,
        isOpen,
        draft,
        update,
        reset,
      }}
    >
      {children}
    </CouponDraftContext.Provider>
  );
}

/* =========================
   HOOK
========================= */

export function useCouponDraft() {
  const ctx = useContext(CouponDraftContext);

  if (!ctx) {
    throw new Error("useCouponDraft must be used inside provider");
  }

  return ctx;
}