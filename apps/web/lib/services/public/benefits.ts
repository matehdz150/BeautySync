import { publicFetch } from "./apiPublic";

// ===============================
// TYPES
// ===============================

export type UserWalletItem = {
  points: number;

  branch: {
    id: string;
    name: string;
    address: string | null;
    slug: string | null;
    coverUrl: string | null;
  };

  benefits: {
    hasGiftCard: boolean;
    totalGiftCardCents: number;

    bestCoupon: {
      type: "percentage" | "fixed";
      value: number;
    } | null;
  };

  // 🔥 NEW
  tier: {
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
};

export type UserWalletResponse = {
  global: {
    totalGiftCardCents: number;
  };
  branches: UserWalletItem[];
};

// ===============================
// API
// ===============================

export async function getUserWallet(): Promise<UserWalletResponse> {
  return publicFetch<UserWalletResponse>(
    `/benefits/program/wallet`
  );
}