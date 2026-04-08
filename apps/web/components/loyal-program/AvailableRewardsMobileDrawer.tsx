"use client";

import { useEffect, useMemo, useState } from "react";
import { Coins, Percent, X } from "lucide-react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PublicApiError } from "@/lib/errors";
import { usePublicBooking } from "@/context/PublicBookingContext";
import {
  BranchBenefitsSummaryResponse,
  getBranchBenefitsSummary,
  redeemBenefitReward,
} from "@/lib/services/public/benefits";

type RewardItem = BranchBenefitsSummaryResponse["rewards"]["all"][number];

function rewardTitle(reward: RewardItem) {
  if (reward.type === "SERVICE" && reward.service?.name) return reward.service.name;
  if (reward.type === "PRODUCT" && reward.product?.name) return reward.product.name;
  return reward.name;
}

function rewardMeta(reward: RewardItem) {
  const points = `${reward.pointsCost.toLocaleString()} puntos`;

  if (reward.type === "SERVICE" && reward.service) {
    const amount =
      reward.service.priceCents != null
        ? `Valor $${Math.round(reward.service.priceCents / 100)} MXN`
        : "Servicio";
    return `${points} · ${reward.service.durationMin} min · ${amount}`;
  }

  if (reward.type === "PRODUCT" && reward.product) {
    return `${points} · Valor $${Math.round(reward.product.priceCents / 100)} MXN`;
  }

  return points;
}

export function AvailableRewardsMobileDrawer({
  open,
  onOpenChange,
  branchId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
}) {
  const booking = usePublicBooking();

  const [summary, setSummary] = useState<BranchBenefitsSummaryResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthenticated, setUnauthenticated] = useState(false);

  const [pendingReward, setPendingReward] = useState<RewardItem | null>(null);
  const [confirmRedeemOpen, setConfirmRedeemOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  const rewards = useMemo(() => summary?.rewards.all ?? [], [summary]);
  const pointsBalance = summary?.points ?? booking.benefits.pointsBalance ?? 0;
  const sortedRewards = useMemo(() => {
    const isRedeemable = (reward: RewardItem) =>
      reward.available ?? pointsBalance >= reward.pointsCost;

    return [...rewards].sort((a, b) => {
      const aRedeemable = isRedeemable(a);
      const bRedeemable = isRedeemable(b);

      if (aRedeemable !== bRedeemable) {
        return aRedeemable ? -1 : 1;
      }

      return a.pointsCost - b.pointsCost;
    });
  }, [pointsBalance, rewards]);

  useEffect(() => {
    if (!open) return;
    const effectiveBranchId = branchId ?? booking.branch?.id;
    if (!effectiveBranchId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setUnauthenticated(false);

    getBranchBenefitsSummary(effectiveBranchId)
      .then((data) => {
        if (cancelled) return;
        setSummary(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof PublicApiError && err.code === "UNAUTHORIZED") {
          setUnauthenticated(true);
          setSummary(null);
          return;
        }
        setError("No se pudieron cargar tus recompensas.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, branchId, booking.branch?.id]);

  useEffect(() => {
    if (!open) return;
    setPendingReward(null);
    setConfirmRedeemOpen(false);
  }, [open, booking.selectedCouponId, booking.appliedCouponCode]);

  async function applyReward() {
    if (!pendingReward) return;
    const effectiveBranchId = branchId ?? booking.branch?.id;
    if (!effectiveBranchId) return;

    const entropy =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const idempotencyKey = `redeem:${effectiveBranchId}:${pendingReward.id}:${entropy}`;

    setApplying(true);
    try {
      await redeemBenefitReward({
        rewardId: pendingReward.id,
        branchId: effectiveBranchId,
        idempotencyKey,
      });

      const updated = await getBranchBenefitsSummary(effectiveBranchId);
      setSummary(updated);
      setPendingReward(null);
      setConfirmRedeemOpen(false);
    } catch (err: unknown) {
      if (err instanceof PublicApiError) {
        // keep drawer open so user can retry after seeing backend reason in logs/ui flow
        console.error(err.message);
      } else {
        console.error("No se pudo canjear la recompensa.");
      }
    } finally {
      setApplying(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[80vh] w-full rounded-t-[28px] p-0 flex flex-col"
        >
        <div className="px-5 py-5 border-b">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[40px] leading-10 font-semibold">
                Descuentos y recompensas
              </h2>
              <p className="text-[15px] text-muted-foreground mt-1">
                Usa tus recompensas o ingresa un código de descuento
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10 w-10 rounded-full flex items-center justify-center text-black/70"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <p className="text-sm text-muted-foreground">Cargando recompensas...</p>
          )}
          {!loading && unauthenticated && (
            <p className="text-sm text-muted-foreground">
              Inicia sesión para ver tus recompensas.
            </p>
          )}
          {!loading && error && <p className="text-sm text-red-600">{error}</p>}

          <div className="mt-7">
            <h3 className="text-[36px] leading-10 font-semibold">
              Usa tus puntos de lealtad
            </h3>
            <p className="text-[15px] text-muted-foreground mt-1">
              {pointsBalance.toLocaleString()} puntos disponibles
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {sortedRewards.map((reward) => (
              <div
                key={reward.id}
                className="w-full flex items-center justify-between gap-4 py-2 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {reward.type === "COUPON" ? (
                    <Percent className="h-6 w-6 text-blue-500 shrink-0" />
                  ) : (
                    <Coins className="h-6 w-6 text-blue-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[17px] font-medium truncate">
                      {rewardTitle(reward)}
                    </p>
                    <p className="text-[15px] text-muted-foreground">
                      {rewardMeta(reward)}
                    </p>
                  </div>
                </div>

                {(reward.available ?? pointsBalance >= reward.pointsCost) ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full px-6 text-base"
                    onClick={() => {
                      setPendingReward(reward);
                      setConfirmRedeemOpen(true);
                    }}
                  >
                    Canjear
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground shrink-0">
                    Te faltan{" "}
                    {Math.max(reward.pointsCost - pointsBalance, 0).toLocaleString()}{" "}
                    pts
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
      </Sheet>

      <Sheet open={confirmRedeemOpen} onOpenChange={setConfirmRedeemOpen}>
        <SheetContent
          side="bottom"
          className="h-[72vh] w-full rounded-t-[28px] p-0 overflow-hidden"
        >
          <div className="h-full flex flex-col bg-white">
            <div className="h-48 bg-gradient-to-b from-fuchsia-100 via-rose-50 to-white" />

            <div className="-mt-20 px-6 flex-1 flex flex-col">
              <div className="mx-auto h-24 w-24 rounded-3xl bg-gradient-to-br from-fuchsia-400 to-purple-300 shadow-lg flex items-center justify-center">
                {pendingReward?.type === "COUPON" ? (
                  <Percent className="h-11 w-11 text-white" />
                ) : (
                  <Coins className="h-11 w-11 text-white" />
                )}
              </div>

              <p className="mt-8 text-center text-xs uppercase tracking-[0.2em] text-gray-400">
                Confirmación de canje
              </p>

              <h3 className="mt-2 text-center text-3xl font-semibold">
                {pendingReward ? rewardTitle(pendingReward) : "Recompensa"}
              </h3>

              <div className="mt-3 h-px w-40 bg-gray-200 mx-auto" />

              <p className="mt-5 text-center text-base text-gray-500">
                Vas a canjear esta recompensa por{" "}
                <span className="font-semibold text-gray-700">
                  {pendingReward?.pointsCost?.toLocaleString() ?? 0} puntos
                </span>
                .
              </p>

              <div className="mt-auto pb-6 space-y-3">
                <Button
                  type="button"
                  className="h-14 w-full rounded-full text-lg font-medium"
                  disabled={!pendingReward || applying}
                  onClick={() => {
                    void applyReward();
                  }}
                >
                  {applying ? "Canjeando..." : "Confirmar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 w-full rounded-full text-base"
                  onClick={() => setConfirmRedeemOpen(false)}
                  disabled={applying}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
