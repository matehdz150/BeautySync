"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  BranchBenefitsSummaryResponse,
  getBranchBenefitsSummary,
  redeemBenefitReward,
} from "@/lib/services/public/benefits";
import { DialogTitle } from "@radix-ui/react-dialog";
import { PublicApiError } from "@/lib/errors";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle as ModalTitle,
} from "@/components/ui/dialog";
import {
  Diamond,
  Gift,
  LucideProps,
  Package,
  Percent,
  Scissors,
  Star,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

type RewardItem = BranchBenefitsSummaryResponse["rewards"]["all"][number];
type RewardFilter = "ALL" | "SERVICE" | "PRODUCT" | "COUPON" | "GIFT_CARD";
type PendingRedeem = {
  reward: RewardItem;
  branchId: string;
  idempotencyKey: string;
};

function buildIdempotencyKey(rewardId: string, branchId: string) {
  const entropy =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `redeem:${branchId}:${rewardId}:${entropy}`;
}

export function AvailableRewardsSheet({
  open,
  onOpenChange,
  branchId,
  side = "right",
  contentClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
  side?: "right" | "bottom";
  contentClassName?: string;
}) {
  const [summary, setSummary] = useState<BranchBenefitsSummaryResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [pendingRedeem, setPendingRedeem] = useState<PendingRedeem | null>(
    null,
  );
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !branchId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setUnauthenticated(false);

    getBranchBenefitsSummary(branchId)
      .then((data) => {
        if (cancelled) return;
        console.log(data);
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
  }, [open, branchId]);

  const available = useMemo(() => summary?.rewards.available ?? [], [summary]);
  const unavailable = useMemo(
    () => summary?.rewards.unavailable ?? [],
    [summary],
  );

  const [filter, setFilter] = useState<RewardFilter>("ALL");

  const filteredRewards = useMemo(() => {
    if (filter === "ALL") return available;
    return available.filter((r) => r.type === filter);
  }, [available, filter]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={side}
          className={cn(
            side === "bottom"
              ? "h-[80vh] w-full flex flex-col rounded-t-2xl"
              : "min-w-120 w-full flex flex-col",
            contentClassName,
          )}
        >
        <DialogTitle className="p-5 pb-0">
          <div className="flex items-center justify-between mb-2">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Canjea tus puntos</h2>
              <p className="text-sm text-gray-500">
                Usa tus puntos para obtener beneficios y recompensas.
              </p>
            </div>

            <button className="text-sm font-medium text-indigo-500 hover:underline">
              Ver más
            </button>
          </div>
        </DialogTitle>

        {loading && (
          <div className="text-sm text-gray-500 py-6">
            Cargando recompensas...
          </div>
        )}

        {!loading && unauthenticated && (
          <div className="py-6 space-y-2">
            <p className="text-sm font-medium">
              Inicia sesión para ver tus recompensas.
            </p>
            <p className="text-xs text-gray-500">
              Necesitas una sesión activa para consultar tus puntos y
              beneficios.
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="py-6 text-sm text-red-600">{error}</div>
        )}

        {!loading && !unauthenticated && !error && summary && (
          <>
            <div className="mb-4 px-2 flex flex-col gap2">
              <div
                className="w-full rounded-2xl p-6 flex items-center justify-between 
bg-gradient-to-br from-black via-gray-800 to-gray-500 text-white"
              >
                {/* LEFT */}
                <div className="space-y-1">
                  <p className="text-sm opacity-80">Puntos disponibles</p>

                  <h2 className="text-4xl font-semibold leading-none">
                    {summary.points.toLocaleString()}
                    <span className="text-lg ml-1 font-normal">pts</span>
                  </h2>

                  <p className="text-sm opacity-80">Listos para canjear</p>
                </div>

                {/* RIGHT (decorativo) */}
                <div className="text-white/30 text-6xl select-none">
                  <Diamond className="h-10 w-10" />
                </div>
              </div>
            </div>
            {/* ========================= */}
            {/* 🧭 TABS */}
            {/* ========================= */}
            <div className="flex gap-6 px-2 border-b mb-2 overflow-x-auto">
              {[
                { key: "ALL", label: "Todos" },
                { key: "SERVICE", label: "Servicios" },
                { key: "PRODUCT", label: "Productos" },
                { key: "COUPON", label: "Cupones" },
                { key: "GIFT_CARD", label: "Gift cards" },
              ].map((tab) => {
                const active = filter === tab.key;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as RewardFilter)}
                    className={`pb-3 text-sm whitespace-nowrap transition relative
          ${active ? "text-black font-medium" : "text-gray-400"}
        `}
                  >
                    {tab.label}

                    {active && (
                      <div className="absolute left-0 bottom-0 w-full h-[2px] bg-black rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ========================= */}
            {/* 📦 LISTA */}
            {/* ========================= */}
            <div className="space-y-2 px-2">
              {filteredRewards.length === 0 && (
                <p className="text-sm text-gray-500">
                  No hay recompensas en esta categoría.
                </p>
              )}

              {filteredRewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  onRedeemClick={() => {
                    if (!branchId) return;
                    const idempotencyKey = buildIdempotencyKey(
                      reward.id,
                      branchId,
                    );

                    setActionMessage(null);
                    setPendingRedeem({
                      reward,
                      branchId,
                      idempotencyKey,
                    });
                    setRedeemModalOpen(true);
                  }}
                />
              ))}
            </div>

            <div className="">
              {unavailable.map((reward) => (
                <LockedRewardCard
                  key={reward.id}
                  reward={reward}
                  points={summary.points}
                />
              ))}
            </div>
          </>
        )}

        <div className="mt-auto px-5 pb-3">
          {actionMessage && <p className="text-xs text-gray-600">{actionMessage}</p>}
        </div>
        </SheetContent>
      </Sheet>

      <Dialog open={redeemModalOpen} onOpenChange={setRedeemModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <ModalTitle>Confirmar canje</ModalTitle>
            <DialogDescription>
              {pendingRedeem
                ? `Vas a canjear "${rewardLabel(pendingRedeem.reward)}" por ${pendingRedeem.reward.pointsCost} puntos.`
                : "Confirma si quieres canjear esta recompensa."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setRedeemModalOpen(false)}
              disabled={isRedeeming}
            >
              Cancelar
            </Button>
            <Button
              disabled={!pendingRedeem || isRedeeming}
              onClick={async () => {
                if (!pendingRedeem) return;

                setIsRedeeming(true);
                setActionMessage(null);

                try {
                  const res = await redeemBenefitReward({
                    rewardId: pendingRedeem.reward.id,
                    branchId: pendingRedeem.branchId,
                    idempotencyKey: pendingRedeem.idempotencyKey,
                  });

                  console.log(res)

                  const updated = await getBranchBenefitsSummary(
                    pendingRedeem.branchId,
                  );

                  setSummary(updated);
                  setActionMessage("Recompensa canjeada correctamente.");
                  setRedeemModalOpen(false);
                  setPendingRedeem(null);
                } catch (err: unknown) {
                  if (err instanceof PublicApiError) {
                    setActionMessage(err.message);
                  } else {
                    setActionMessage("No se pudo canjear la recompensa.");
                  }
                } finally {
                  setIsRedeeming(false);
                }
              }}
            >
              {isRedeeming ? "Canjeando..." : "Confirmar canje"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RewardCard({
  reward,
  onRedeemClick,
}: {
  reward: RewardItem;
  onRedeemClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-lg">
          <RewardIcon type={reward.type} className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <p className="font-medium truncate">{rewardLabel(reward)}</p>
          <p className="text-xs text-gray-500 truncate">{rewardMeta(reward)}</p>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="rounded-full px-5 py-5 text-sm shadow-none"
        onClick={onRedeemClick}
      >
        Canjear
      </Button>
    </div>
  );
}

function LockedRewardCard({
  reward,
  points,
}: {
  reward: RewardItem;
  points: number;
}) {
  const missing = Math.max(reward.pointsCost - points, 0);
  return (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-lg opacity-60">
          <RewardIcon type={reward.type} className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{rewardLabel(reward)}</p>
          <p className="text-xs text-gray-500 truncate">
            Te faltan {missing} puntos
          </p>
        </div>
      </div>
      <span className="text-xs text-gray-500">{reward.pointsCost} pts</span>
    </div>
  );
}

type GradientIconProps = LucideProps & {
  colors?: [string, string];
};

export function GradientIcon({
  children,
  colors = ["#5b5bf7", "#c14ef0"],
  ...props
}: GradientIconProps & { children: React.ReactElement }) {
  const reactId = useId();
  const gradientId = `grad-${reactId.replace(/:/g, "")}`;

  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
        </defs>
      </svg>

      {React.cloneElement(children, {
        ...props,
        stroke: `url(#${gradientId})`,
      })}
    </>
  );
}

function RewardIcon({
  type,
  className,
}: {
  type: RewardItem["type"];
  className?: string;
}) {
  switch (type) {
    case "SERVICE":
      return (
        <GradientIcon>
          <Scissors className={className} />
        </GradientIcon>
      );

    case "PRODUCT":
      return (
        <GradientIcon colors={["#10B981", "#34D399"]}>
          <Package className={className} />
        </GradientIcon>
      );

    case "COUPON":
      return (
        <GradientIcon colors={["#3B82F6", "#60A5FA"]}>
          <Percent className={className} />
        </GradientIcon>
      );

    case "GIFT_CARD":
      return (
        <GradientIcon colors={["#F59E0B", "#FBBF24"]}>
          <Gift className={className} />
        </GradientIcon>
      );

    default:
      return (
        <GradientIcon colors={["#9CA3AF", "#D1D5DB"]}>
          <Star className={className} />
        </GradientIcon>
      );
  }
}

function rewardLabel(reward: RewardItem) {
  if (reward.type === "SERVICE" && reward.service) return reward.service.name;
  if (reward.type === "PRODUCT" && reward.product) return reward.product.name;
  return reward.name;
}

function rewardMeta(reward: RewardItem) {
  if (reward.type === "SERVICE" && reward.service) {
    const price =
      reward.service.priceCents != null
        ? `$${Math.round(reward.service.priceCents / 100)}`
        : "Sin precio";
    return `${reward.pointsCost} pts · ${reward.service.durationMin} min · ${price}`;
  }

  if (reward.type === "PRODUCT" && reward.product) {
    return `${reward.pointsCost} pts · $${Math.round(reward.product.priceCents / 100)}`;
  }

  return `${reward.pointsCost} puntos`;
}
