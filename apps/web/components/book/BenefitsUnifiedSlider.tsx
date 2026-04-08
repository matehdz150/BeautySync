"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Coins, Percent } from "lucide-react";

type GiftCardItem = {
  id: string;
  code: string;
  balanceCents: number;
  expiresAt?: string | null;
};

type CouponItem = {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  expiresAt?: string | null;
  serviceName?: string | null;
  serviceNames?: string[];
};

type CouponDiagnostic = {
  valid: boolean;
  reason: string;
};

type UnifiedItem =
  | { kind: "giftCard"; id: string; giftCard: GiftCardItem }
  | { kind: "coupon"; id: string; coupon: CouponItem };

function money(cents: number) {
  return `$${Math.round(cents / 100)} MXN`;
}

function formatExpires(expiresAt?: string | null) {
  if (!expiresAt) return null;
  try {
    return new Date(expiresAt).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function getFreeServiceName(coupon: CouponItem) {
  return coupon.serviceName ?? coupon.serviceNames?.[0] ?? null;
}

function isFreeServiceCoupon(coupon: CouponItem) {
  return (
    coupon.type === "percentage" &&
    coupon.value === 100 &&
    Boolean(getFreeServiceName(coupon))
  );
}

function getCouponTitle(coupon: CouponItem) {
  const freeServiceName = isFreeServiceCoupon(coupon)
    ? getFreeServiceName(coupon)
    : null;

  if (freeServiceName) return `${freeServiceName} gratis`;
  if (coupon.type === "percentage") return `${coupon.value}% de descuento`;
  return `${money(coupon.value)} de descuento`;
}

export function BenefitsUnifiedSlider({
  giftCards,
  coupons,
  selectedGiftCardId,
  selectedCouponId,
  couponDiagnostics,
  onSelectGiftCard,
  onSelectCoupon,
  branchName,
}: {
  giftCards: GiftCardItem[];
  coupons: CouponItem[];
  selectedGiftCardId: string | null;
  selectedCouponId: string | null;
  couponDiagnostics: Record<string, CouponDiagnostic>;
  onSelectGiftCard: (id: string) => void;
  onSelectCoupon: (coupon: CouponItem) => Promise<void>;
  branchName?: string | null;
}) {
  const [allOpen, setAllOpen] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const items = useMemo<UnifiedItem[]>(
    () => [
      ...giftCards.map((giftCard) => ({
        kind: "giftCard" as const,
        id: giftCard.id,
        giftCard,
      })),
      ...coupons.map((coupon) => ({
        kind: "coupon" as const,
        id: coupon.id,
        coupon,
      })),
    ],
    [giftCards, coupons],
  );

  if (!items.length) return null;

  return (
    <>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Tus beneficios</h2>
          <button
            type="button"
            className="text-sm font-medium text-indigo-600"
            onClick={() => setAllOpen(true)}
          >
            Ver todo
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {items.map((item) => (
            <div
              key={item.id}
              className={
                item.kind === "giftCard"
                  ? "min-w-62 shrink-0"
                  : "w-50 shrink-0"
              }
            >
              {item.kind === "giftCard" ? (
                <button
                  type="button"
                  onClick={() => onSelectGiftCard(item.giftCard.id)}
                  className="w-full focus:outline-none"
                >
                  <div
                    className={cn(
                      "relative w-full h-30 rounded-2xl p-5 text-white flex flex-col justify-between border",
                      selectedGiftCardId === item.giftCard.id
                        ? "border-white"
                        : "border-white/30",
                    )}
                    style={{
                      background: "linear-gradient(135deg, #5b5bf7, #c14ef0)",
                    }}
                  >
                    <div className="absolute top-4 right-4">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center",
                          selectedGiftCardId === item.giftCard.id
                            ? "bg-white border-white"
                            : "border-white/70",
                        )}
                      >
                        {selectedGiftCardId === item.giftCard.id && (
                          <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-medium truncate">
                      {branchName ?? "Tu negocio"}
                    </p>

                    <p className="text-2xl font-semibold">
                      ${(item.giftCard.balanceCents / 100).toFixed(0)}
                    </p>

                    <p className="text-xs font-mono opacity-80">
                      {item.giftCard.code}
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={selectingId === item.coupon.id}
                  onClick={async () => {
                    try {
                      setSelectingId(item.coupon.id);
                      await onSelectCoupon(item.coupon);
                    } finally {
                      setSelectingId(null);
                    }
                  }}
                  className={cn(
                    "w-full h-30 rounded-2xl border p-4 text-left transition",
                    selectedCouponId === item.coupon.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-black/10 bg-white hover:bg-gray-50",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {item.coupon.type === "percentage" ? (
                      <Percent className="h-4 w-4 text-indigo-600" />
                    ) : (
                      <Coins className="h-4 w-4 text-indigo-600" />
                    )}
                    <p className="text-xs text-muted-foreground">Cupón</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold truncate">
                    {getCouponTitle(item.coupon)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    {item.coupon.code}
                    {formatExpires(item.coupon.expiresAt)
                      ? ` · Vence ${formatExpires(item.coupon.expiresAt)}`
                      : ""}
                  </p>

                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <Dialog open={allOpen} onOpenChange={setAllOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Todos tus beneficios</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={`all-${item.id}`}
                className={cn(
                  "rounded-xl border p-3 flex items-center justify-between gap-3",
                  item.kind === "giftCard" && selectedGiftCardId === item.giftCard.id
                    ? "border-indigo-500 bg-indigo-50"
                    : item.kind === "coupon" && selectedCouponId === item.coupon.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-black/10",
                )}
              >
                <div className="min-w-0">
                  {item.kind === "giftCard" ? (
                    <>
                      <p className="text-sm font-medium">Gift card {item.giftCard.code}</p>
                      <p className="text-xs text-muted-foreground">
                        Saldo: {money(item.giftCard.balanceCents)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium truncate">
                        {getCouponTitle(item.coupon)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.coupon.code}
                      </p>
                    </>
                  )}
                </div>
                {item.kind === "giftCard" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectGiftCard(item.giftCard.id)}
                  >
                    Usar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={selectingId === item.coupon.id}
                    onClick={async () => {
                      try {
                        setSelectingId(item.coupon.id);
                        await onSelectCoupon(item.coupon);
                      } finally {
                        setSelectingId(null);
                      }
                    }}
                  >
                    Usar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
