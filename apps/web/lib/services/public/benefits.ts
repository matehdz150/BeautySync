import { publicFetch } from "./apiPublic";

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
};

export async function getUserWallet(): Promise<UserWalletItem[]> {
  return publicFetch<UserWalletItem[]>(
    `/benefits/program/wallet`
  );
}