import { api } from "./api";

/* =========================
   TYPES
========================= */

export type GiftCard = {
  id: string;
  branchId: string;
  code: string;

  initialAmountCents: number;
  balanceCents: number;

  currency: string;
  status: "active" | "redeemed" | "expired" | "cancelled";

  ownerUserId: string | null;

  expiresAt: string | null;

  issuedToEmail: string| null;

  createdAt: string;
  updatedAt: string;
};

export type GiftCardTransaction = {
  id: string;
  giftCardId: string;
  type: "issue" | "redeem" | "refund" | "adjustment";
  amountCents: number;

  referenceType: "booking" | "order" | "manual" | null;
  referenceId: string | null;

  note: string | null;
  createdAt: string;
};

/* =========================
   CREATE
========================= */

export async function createGiftCard(input: {
  branchId: string;
  initialAmountCents: number;
  currency?: string;
  expiresAt?: string;
  ownerUserId?: string;
  issuedToEmail?: string;
}) {
  return api<GiftCard>("/gift-cards", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* =========================
   GET BY BRANCH (ADMIN)
========================= */

export async function getGiftCardsByBranch(branchId: string) {
  return api<GiftCard[]>(`/gift-cards/branch/${branchId}`);
}

/* =========================
   GET MY GIFT CARDS (PUBLIC USER)
========================= */

export async function getMyGiftCards() {
  return api<GiftCard[]>(`/gift-cards/me`);
}

/* =========================
   GET BY ID
========================= */

export async function getGiftCardById(id: string) {
  return api<GiftCard>(`/gift-cards/${id}`);
}

/* =========================
   GET TRANSACTIONS
========================= */

export async function getGiftCardTransactions(giftCardId: string) {
  return api<GiftCardTransaction[]>(
    `/gift-cards/${giftCardId}/transactions`
  );
}

/* =========================
   ASSIGN
========================= */

export async function assignGiftCard(input: {
  giftCardId: string;
  userId: string;
}) {
  return api<GiftCard>(`/gift-cards/assign`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* =========================
   UNASSIGN
========================= */

export async function unassignGiftCard(input: {
  giftCardId: string;
}) {
  return api<GiftCard>(`/gift-cards/unassign`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}