"use client";

import { createContext, useContext, useState } from "react";

export type Reward = {
  type: "ONE_TIME" | "RECURRING";
  config: any;
};

type TierEditorState = {
  rewards: Reward[];
  setRewards: React.Dispatch<React.SetStateAction<Reward[]>>;
  rewardsHydrated: boolean;
  setRewardsHydrated: React.Dispatch<React.SetStateAction<boolean>>;
};

const TierEditorContext = createContext<TierEditorState | null>(null);

export function TierEditorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardsHydrated, setRewardsHydrated] = useState(false);

  return (
    <TierEditorContext.Provider
      value={{
        rewards,
        setRewards,
        rewardsHydrated,
        setRewardsHydrated,
      }}
    >
      {children}
    </TierEditorContext.Provider>
  );
}

export const useTierEditor = () => {
  const ctx = useContext(TierEditorContext);
  if (!ctx) throw new Error("useTierEditor must be used inside provider");
  return ctx;
};