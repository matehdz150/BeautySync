"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type Branch = {
  organizationId: string;
  id: string;
  name: string;
  address?: string | null;
  lat?: string | null;
  lng?: string | null;
};

type BranchCtx = {
  branch: Branch | null;
  setBranch: (b: Branch | null) => void;
};

const Ctx = createContext<BranchCtx | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branch, setBranchState] = useState<Branch | null>(null);

  function setBranch(b: Branch | null) {
    if (b) localStorage.setItem("branch", JSON.stringify(b));
    else localStorage.removeItem("branch");

    setBranchState(b);
  }

  return (
    <Ctx.Provider value={{ branch, setBranch }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBranch must be inside BranchProvider");
  return ctx;
}