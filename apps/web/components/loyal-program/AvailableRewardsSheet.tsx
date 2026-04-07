"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  BranchBenefitsSummaryResponse,
  getBranchBenefitsSummary,
} from "@/lib/services/public/benefits";
import { DialogTitle } from "@radix-ui/react-dialog";
import { PublicApiError } from "@/lib/errors";

type RewardItem = BranchBenefitsSummaryResponse["rewards"]["all"][number];

export function AvailableRewardsSheet({
  open,
  onOpenChange,
  branchId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
}) {
  const [summary, setSummary] = useState<BranchBenefitsSummaryResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !branchId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setUnauthenticated(false);

    getBranchBenefitsSummary(branchId)
      .then((data) => {
        if (cancelled) return;
        console.log(data)
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[420px] sm:w-[480px] flex flex-col p-5"
      >
        <DialogTitle>
          <div className="space-y-1 mb-4">
            <h2 className="text-xl font-semibold">Descuentos y recompensas</h2>
            <p className="text-sm text-gray-500">
              Usa tus recompensas disponibles y revisa cuáles te faltan.
            </p>
          </div>
        </DialogTitle>

        {loading && (
          <div className="text-sm text-gray-500 py-6">Cargando recompensas...</div>
        )}

        {!loading && unauthenticated && (
          <div className="py-6 space-y-2">
            <p className="text-sm font-medium">Inicia sesión para ver tus recompensas.</p>
            <p className="text-xs text-gray-500">
              Necesitas una sesión activa para consultar tus puntos y beneficios.
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="py-6 text-sm text-red-600">{error}</div>
        )}

        {!loading && !unauthenticated && !error && summary && (
          <>
            <div className="mb-4 rounded-xl border p-3 bg-gray-50">
              <p className="text-sm font-medium">
                {summary.points.toLocaleString()} puntos disponibles
              </p>
              <p className="text-xs text-gray-500">
                {summary.currentTier
                  ? `Tier actual: ${summary.currentTier.name}`
                  : "Sin tier asignado"}
              </p>
              <p className="text-xs text-gray-500">
                {summary.nextTier
                  ? `Te faltan ${summary.pointsToNextTier} pts para ${summary.nextTier.name}`
                  : "Ya estás en el tier más alto"}
              </p>
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-sm font-semibold">Disponibles ahora</p>
              {available.length === 0 && (
                <p className="text-sm text-gray-500">
                  No tienes recompensas alcanzables con tus puntos actuales.
                </p>
              )}
              {available.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  selected={selectedRewardId === reward.id}
                  onSelect={() =>
                    setSelectedRewardId(
                      selectedRewardId === reward.id ? null : reward.id,
                    )
                  }
                />
              ))}
            </div>

            <div className="mt-2 border-t pt-4 space-y-2">
              <p className="text-sm font-semibold">Te falta para desbloquear</p>
              {unavailable.length === 0 && (
                <p className="text-sm text-gray-500">
                  No hay recompensas bloqueadas.
                </p>
              )}
              {unavailable.map((reward) => (
                <LockedRewardCard key={reward.id} reward={reward} points={summary.points} />
              ))}
            </div>
          </>
        )}

        <div className="mt-auto pt-6 flex gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 border rounded-xl py-3"
          >
            Cerrar
          </button>

          <button
            disabled={!selectedRewardId}
            className="flex-1 bg-black text-white rounded-xl py-3 disabled:opacity-50"
          >
            Aplicar
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function RewardCard({
  reward,
  selected,
  onSelect,
}: {
  reward: RewardItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className="flex items-center justify-between p-3 rounded-xl border cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-lg">{rewardIcon(reward.type)}</div>

        <div className="min-w-0">
          <p className="font-medium truncate">{rewardLabel(reward)}</p>
          <p className="text-xs text-gray-500 truncate">{rewardMeta(reward)}</p>
        </div>
      </div>

      <div className={`w-5 h-5 rounded border ${selected ? "bg-black" : ""}`} />
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
    <div className="flex items-center justify-between p-3 rounded-xl border border-dashed">
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-lg opacity-60">{rewardIcon(reward.type)}</div>
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

function rewardIcon(type: RewardItem["type"]) {
  switch (type) {
    case "SERVICE":
      return "✂️";
    case "PRODUCT":
      return "🧴";
    case "COUPON":
      return "%";
    case "GIFT_CARD":
      return "🎁";
    default:
      return "⭐";
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
