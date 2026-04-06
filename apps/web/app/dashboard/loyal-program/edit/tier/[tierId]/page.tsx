"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

import { updateTier, getTierById } from "@/lib/services/benefits";
import { useBranch } from "@/context/BranchContext";
import { useTierEditor, type Reward } from "@/context/TierEditorContext";

import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/shared/Icon";
import { ColorPickerModal } from "@/components/loyal-program/ColorPickerModal";
import { IconPickerModal } from "@/components/loyal-program/IconPickerModal";
import { getTierGradient } from "@/lib/helpers/colors/colors";
import { Crown, Gift, Percent, HandCoins, MoreVertical } from "lucide-react";

export default function EditTierPage() {
  const router = useRouter();
  const params = useParams();

  const tierId = params?.tierId as string | undefined;

  const { branch } = useBranch();
  const branchId = branch?.id;

  const {
    rewards,
    setRewards,
    rewardsHydrated,
    setRewardsHydrated,
  } = useTierEditor();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [icon, setIcon] = useState("");
  const [minPoints, setMinPoints] = useState(0);

  const [showColorModal, setShowColorModal] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);

  useEffect(() => {
    if (!tierId) return;

    const load = async () => {
      try {
        const res = await getTierById(tierId);

        setName(res.tier.name);
        setDescription(res.tier.description || "");
        setColor(res.tier.color || "");
        setIcon(res.tier.icon || "");
        setMinPoints(res.tier.minPoints);

        if (!rewardsHydrated) {
          setRewards(
            (res.rewards || []).map((r) => ({
              type: r.type,
              config: r.config,
            })),
          );
          setRewardsHydrated(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    load();
  }, [tierId, rewardsHydrated, setRewards, setRewardsHydrated]);

  const isInvalid =
    !branchId || !name || minPoints <= 0 || rewards.length === 0;

  const handleSubmit = async () => {
    try {
      if (!branchId || !tierId) {
        alert("Sucursal inválida");
        return;
      }

      setLoading(true);

      await updateTier({
        tierId,
        branchId,
        name,
        description,
        color,
        icon,
        minPoints,
        rewards,
      });

      setRewards([]);
      setRewardsHydrated(false);

      router.push("/dashboard/loyal-program");
    } catch (err) {
      console.error(err);
      alert("Error actualizando tier");
    } finally {
      setLoading(false);
    }
  };

  if (!tierId) {
    return <div className="p-10">Resolviendo ruta...</div>;
  }

  if (initialLoading) {
    return <div className="p-10">Cargando tier...</div>;
  }

  return (
    <div className="h-screen overflow-y-auto bg-white px-6 py-10 pb-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-end gap-3">
          <Button onClick={() => router.back()} variant="outline">
            Cerrar
          </Button>

          <button
            onClick={handleSubmit}
            disabled={loading || isInvalid}
            className="px-6 py-2 bg-black text-white rounded-lg disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        <div>
          <h1 className="text-3xl font-semibold">Editar nivel</h1>
        </div>

        <div className="flex items-end gap-3">
          <button
            onClick={() => setShowColorModal(true)}
            className={`w-14 h-14 rounded-xl border bg-gradient-to-br ${getTierGradient(
              color,
            )}`}
          />

          <button
            onClick={() => setShowIconModal(true)}
            className="w-14 h-14 rounded-xl border flex items-center justify-center"
          >
            {icon ? (
              <CategoryIcon
                name={icon}
                className="w-5 h-5"
                style={{
                  color: color ? `#${color}` : "#666",
                  fill: color ? `#${color}25` : "transparent",
                }}
              />
            ) : (
              <Crown />
            )}
          </button>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 border rounded-xl px-4 py-3"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción"
            className="border rounded-xl p-3"
          />

          <input
            value={minPoints || ""}
            onChange={(e) => setMinPoints(Number(e.target.value))}
            placeholder="Puntos"
            className="border rounded-xl p-3"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-medium">Recompensas</h3>

          <Button
            onClick={() =>
              router.push(
                `/dashboard/loyal-program/edit/tier/${tierId}/reward/config`,
              )
            }
            variant="outline"
          >
            + Agregar recompensa
          </Button>

          <div className="space-y-3">
            {!rewards.length && (
              <div className="border rounded-xl p-4 text-sm text-gray-500">
                No hay recompensas aún
              </div>
            )}

            {rewards.map((reward, i) => (
              <RewardItemCard
                key={`${reward.config.type}-${i}`}
                reward={reward}
                index={i}
                tierId={tierId}
              />
            ))}
          </div>
        </div>
      </div>

      <ColorPickerModal
        open={showColorModal}
        onOpenChange={setShowColorModal}
        onSelect={setColor}
      />

      <IconPickerModal
        open={showIconModal}
        onOpenChange={setShowIconModal}
        onSelect={setIcon}
        color={color}
      />
    </div>
  );
}

function RewardItemCard({
  reward,
  index,
  tierId,
}: {
  reward: Reward;
  index: number;
  tierId: string;
}) {
  const router = useRouter();

  const getIcon = () => {
    switch (reward.config.type) {
      case "gift_card":
        return <Gift className="w-4 h-4 text-green-600" />;
      case "coupon_percentage":
        return <Percent className="w-4 h-4 text-green-600" />;
      case "coupon_fixed":
        return <HandCoins className="w-4 h-4 text-green-600" />;
      default:
        return <Gift className="w-4 h-4 text-green-600" />;
    }
  };

  const getTitle = () => {
    switch (reward.config.type) {
      case "gift_card":
        return `$${(reward.config.amountCents / 100).toLocaleString("es-MX")} MXN`;
      case "coupon_percentage":
        return `${reward.config.value}% descuento`;
      case "coupon_fixed":
        return `$${reward.config.value} MXN descuento`;
      default:
        return "Recompensa";
    }
  };

  const getSubtitle = () => {
    return reward.type === "ONE_TIME" ? "Una sola vez" : "Recurrente";
  };

  return (
    <div className="bg-white border rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
          {getIcon()}
        </div>

        <div>
          <p className="font-medium">{getTitle()}</p>
          <p className="text-sm text-gray-500">{getSubtitle()}</p>
        </div>
      </div>

      <button
        onClick={() => {
          router.push(
            `/dashboard/loyal-program/edit/tier/${tierId}/reward/config?index=${index}&type=${reward.config.type}`,
          );
        }}
        className="p-2 hover:bg-gray-100 rounded-lg"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}