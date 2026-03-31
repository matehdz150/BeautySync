import { publicFetch } from "./apiPublic";

export type PaymentBenefits = {
  isAuthenticated: boolean;

  giftCards: {
    id: string;
    code: string;
    balanceCents: number;
    expiresAt?: string | null;
  }[];

  coupons: {
    id: string;
    code: string;
    type: "percentage" | "fixed";
    value: number;
    expiresAt?: string | null;
  }[];
};

export async function getPaymentBenefits(
  branchId: string
): Promise<PaymentBenefits> {
  return publicFetch<PaymentBenefits>(
    `/public-payments/benefits?branchId=${branchId}`,
    {
      method: "GET",
    }
  );
}