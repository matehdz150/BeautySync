"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type RewardType = "ONE_TIME" | "RECURRING";

export type TierDraftReward = {
  type: RewardType;
  config: any;
};

export type TierDraft = {
  name: string;
  description: string;
  color: string;
  icon: string;
  minPoints: number;
  rewards: TierDraftReward[];
};

type TierDraftContextValue = {
  draft: TierDraft;
  updateDraft: (partial: Partial<TierDraft>) => void;
  addReward: (reward: TierDraftReward) => void;
  reset: () => void;
};

const DEFAULT_DRAFT: TierDraft = {
  name: "",
  description: "",
  color: "",
  icon: "",
  minPoints: 0,
  rewards: [],
};

const STORAGE_KEY = "tierDraft";

const TierDraftContext = createContext<TierDraftContextValue | null>(null);

export function TierDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<TierDraft>(DEFAULT_DRAFT);

  // hydrate from sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as TierDraft;
        setDraft({ ...DEFAULT_DRAFT, ...parsed });
      } catch {
        // ignore corrupted draft
      }
    }
  }, []);

  // persist to sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const updateDraft = (partial: Partial<TierDraft>) =>
    setDraft((prev) => ({ ...prev, ...partial }));

  const addReward = (reward: TierDraftReward) =>
    setDraft((prev) => ({ ...prev, rewards: [...prev.rewards, reward] }));

  const reset = () => {
    setDraft(DEFAULT_DRAFT);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <TierDraftContext.Provider value={{ draft, updateDraft, addReward, reset }}>
      {children}
    </TierDraftContext.Provider>
  );
}

export function useTierDraft() {
  const ctx = useContext(TierDraftContext);
  if (!ctx) throw new Error("useTierDraft must be used within TierDraftProvider");
  return ctx;
}
