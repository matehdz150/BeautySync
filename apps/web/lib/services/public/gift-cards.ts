// =====================
// 🎁 CLAIM GIFT CARD

import { publicFetch } from "./apiPublic";

// =====================
export async function claimGiftCard(input: {
  code: string;
}) {
  return publicFetch<{
    claimed?: boolean;
    alreadyOwned?: boolean;
    giftCard: {
      id: string;
      code: string;
      balanceCents: number;
      currency: string;
    };
  }>("/gift-cards/claim", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// =====================
// 🔍 GET GIFT CARD BY CODE (PUBLIC)
// =====================
export async function getGiftCardByCode(code: string) {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("Falta NEXT_PUBLIC_API_URL");

  const res = await fetch(`${base}/gift-cards/by-code?code=${code}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.message ?? "No se pudo obtener la gift card");
  }

  return json as {
    code: string;
    balanceCents: number;
    currency: string;

    status: string;
    isClaimed: boolean;
    isExpired: boolean;

    branchName: string;
    coverUrl: string | null;
  };
}