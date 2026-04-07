"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createTier } from "@/lib/services/benefits";
import { useBranch } from "@/context/BranchContext";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/shared/Icon";
import { ColorPickerModal } from "@/components/loyal-program/ColorPickerModal";
import { getTierGradient } from "@/lib/helpers/colors/colors";
import { IconPickerModal } from "@/components/loyal-program/IconPickerModal";
import { Crown, Gift, HandCoins, MoreVertical, Percent } from "lucide-react";
import { useTierDraft, RewardType } from "./TierDraftContext";

const toSafeNumber = (v: string) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

export default function CreateTierPage() {
  const router = useRouter();
  const { branch } = useBranch();
  const { draft, updateDraft, reset } = useTierDraft();

  const branchId = branch?.id ?? "";

  const [loading, setLoading] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);

  const addReward = () => {
    router.push("/dashboard/loyal-program/create/tier/reward");
  };

  const updateReward = (index: number, data: any) => {
    const copy = [...draft.rewards];
    copy[index] = { ...copy[index], ...data };
    updateDraft({ rewards: copy });
  };

  const updateConfig = (index: number, config: any) => {
    const copy = [...draft.rewards];
    copy[index].config = { ...copy[index].config, ...config };
    updateDraft({ rewards: copy });
  };

  const isInvalid =
    !branchId ||
    !draft.name ||
    draft.minPoints <= 0 ||
    draft.rewards.length === 0;

  const handleSubmit = async () => {
    try {
      if (!branchId) return alert("Sucursal inválida");

      setLoading(true);

      await createTier({
        branchId,
        name: draft.name,
        description: draft.description,
        color: draft.color,
        icon: draft.icon,
        minPoints: draft.minPoints,
        rewards: draft.rewards,
      });

      reset();

      router.push("/dashboard/loyal-program");
    } catch (err) {
      console.error(err);
      alert("Error al crear tier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-white px-6 py-10 pb-50">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={() => router.push('/dashboard/loyal-program')}
            variant="outline"
            className="px-6 py-6 text-sm"
          >
            Cerrar
          </Button>

          <button
            onClick={handleSubmit}
            disabled={loading || isInvalid}
            className="px-6 py-2 text-sm bg-black text-white rounded-lg disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-semibold">Crear nivel de fidelidad</h1>

          <p className="text-gray-500 text-sm mt-2">
            Define los niveles de tus clientes y sus beneficios.
          </p>
        </div>

        {/* BASIC INFO */}
        <div className="flex items-end gap-3">
          {/* NAME */}
          <button
            type="button"
            onClick={() => setShowColorModal(true)}
            className={`w-14 h-14 rounded-xl border flex items-center justify-center
  bg-gradient-to-br ${getTierGradient(draft.color)}
`}
          />

          {/* ICON PICKER */}
          <button
            type="button"
            onClick={() => setShowIconModal(true)}
            className="w-14 h-14 rounded-xl border flex items-center justify-center transition hover:scale-105"
          >
            {draft.icon ? (
              <CategoryIcon
                name={draft.icon}
                className="w-5 h-5"
                style={{
                  color: draft.color ? `#${draft.color}` : "#666",
                  fill: draft.color ? `#${draft.color}25` : "transparent",
                }}
              />
            ) : (
              <Crown
                style={{
                  color: draft.color ? `#${draft.color}` : "#FFD700",
                  fill: draft.color ? `#${draft.color}25` : "#FFD70035",
                }}
              />
            )}
          </button>
          <div className="flex-1">
            <FancyInput
              label="Nombre"
              value={draft.name}
              onChange={(v) => updateDraft({ name: v })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1">
            <FancyInput
              label="Descripción"
              value={draft.description}
              onChange={(v) => updateDraft({ description: v })}
            />
          </div>

          <div className="col-span-1">
            <FancyInput
              label="Puntos necesarios"
              value={draft.minPoints}
              onChange={(v) => updateDraft({ minPoints: toSafeNumber(v) })} // 🔥 FIX
              suffix="pts"
            />
          </div>
        </div>

        {/* REWARDS */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-medium text-black">Recompensas</h3>
          </div>
          <Button
            onClick={addReward}
            className="text-sm px-5 py-5 shadow-none rounded-full"
            variant={"outline"}
          >
            + Agregar recompensa
          </Button>

          <div className="space-y-3">
            {!draft.rewards.length && (
              <div className="border rounded-xl p-4 text-sm text-gray-500">
                No hay recompensas aún
              </div>
            )}

            {draft.rewards.map((reward, i) => (
              <RewardItemCard key={i} reward={reward} />
            ))}
          </div>
        </div>
      </div>
      {showColorModal && (
        <ColorPickerModal
          open={showColorModal}
          onOpenChange={setShowColorModal}
          onSelect={(c) => {
            updateDraft({ color: c });
          }}
        />
      )}
      <IconPickerModal
        open={showIconModal}
        onOpenChange={setShowIconModal}
        onSelect={(selected) => updateDraft({ icon: selected })}
        color={draft.color}
      />
    </div>
  );
}

// ===============================
// INPUT
// ===============================

function FancyInput({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <div>
      <label className="text-sm text-gray-600 block mb-1">{label}</label>

      <div className="relative">
        <Input
          value={value === 0 ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border rounded-xl px-4 py-6 text-sm pr-16"
        />

        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function RewardItemCard({
  reward,
}: {
  reward: {
    type: RewardType;
    config: any;
  };
}) {
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
        return `$${(reward.config.amountCents / 100).toLocaleString(
          "es-MX",
        )} MXN`;
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
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
          {getIcon()}
        </div>

        <div>
          <p className="font-medium">{getTitle()}</p>
          <p className="text-sm text-gray-500">{getSubtitle()}</p>
        </div>
      </div>

      {/* RIGHT */}
      <button className="p-2 hover:bg-gray-100 rounded-lg">
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}
