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
import { Crown } from "lucide-react";

type RewardType = "ONE_TIME" | "RECURRING";
type ConfigType = "gift_card" | "coupon_percentage" | "coupon_fixed";

const toSafeNumber = (v: string) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

export default function CreateTierPage() {
  const router = useRouter();
  const { branch } = useBranch();

  const branchId = branch?.id ?? "";

  const [loading, setLoading] = useState(false);

  // =========================
  // TIER DATA
  // =========================
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [icon, setIcon] = useState("");
  const [minPoints, setMinPoints] = useState(0);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);

  // =========================
  // REWARDS
  // =========================
  const [rewards, setRewards] = useState<
    {
      type: RewardType;
      config: any;
    }[]
  >([]);

  const addReward = () => {
    setRewards((prev) => [
      ...prev,
      {
        type: "ONE_TIME",
        config: {
          type: "gift_card",
          amountCents: 10000,
        },
      },
    ]);
  };

  const updateReward = (index: number, data: any) => {
    setRewards((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...data };
      return copy;
    });
  };

  const updateConfig = (index: number, config: any) => {
    setRewards((prev) => {
      const copy = [...prev];
      copy[index].config = {
        ...copy[index].config,
        ...config,
      };
      return copy;
    });
  };

  // =========================
  // VALIDATION
  // =========================
  const isInvalid =
    !branchId || !name || minPoints <= 0 || rewards.length === 0;

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async () => {
    try {
      if (!branchId) return alert("Sucursal inválida");

      setLoading(true);

      await createTier({
        branchId,
        name,
        description,
        color,
        icon,
        minPoints,
        rewards,
      });

      router.push("/dashboard/loyal-program");
    } catch (err) {
      console.error(err);
      alert("Error al crear tier");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-white px-6 py-10 pb-200">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={() => router.back()}
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
  bg-gradient-to-br ${getTierGradient(color)}
`}
          />

          {/* ICON PICKER */}
          <button
            type="button"
            onClick={() => setShowIconModal(true)}
            className="w-14 h-14 rounded-xl border flex items-center justify-center transition hover:scale-105"
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
              <Crown style={{
                  color: color ? `#${color}` : "#FFD700",
                  fill: color ? `#${color}25` : '#FFD70035'
                }}/>
            )}
          </button>
          <div className="flex-1">
            <FancyInput label="Nombre" value={name} onChange={setName} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1">
            <FancyInput
              label="Descripción"
              value={description}
              onChange={setDescription}
            />
          </div>

          <div className="col-span-1">
            <FancyInput
              label="Puntos necesarios"
              value={minPoints}
              onChange={(v) => setMinPoints(toSafeNumber(v))} // 🔥 FIX
              suffix="pts"
            />
          </div>
        </div>

        {/* REWARDS */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Recompensas</h3>

            <button onClick={addReward} className="text-sm text-indigo-500">
              + Agregar recompensa
            </button>
          </div>

          {rewards.map((reward, i) => (
            <div key={i} className="border rounded-xl p-4 space-y-3">
              {/* TYPE */}
              <select
                value={reward.type}
                onChange={(e) => updateReward(i, { type: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm"
              >
                <option value="ONE_TIME">Una sola vez</option>
                <option value="RECURRING">Recurrente</option>
              </select>

              {/* CONFIG TYPE */}
              <select
                value={reward.config.type}
                onChange={(e) => updateConfig(i, { type: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm"
              >
                <option value="gift_card">Gift Card</option>
                <option value="coupon_percentage">Cupón %</option>
                <option value="coupon_fixed">Cupón fijo</option>
              </select>

              {/* DYNAMIC CONFIG */}
              {reward.config.type === "gift_card" && (
                <FancyInput
                  label="Monto"
                  suffix="MXN"
                  value={reward.config.amountCents / 100 || ""}
                  onChange={(v) =>
                    updateConfig(i, {
                      amountCents: toSafeNumber(v) * 100,
                    })
                  }
                />
              )}

              {(reward.config.type === "coupon_percentage" ||
                reward.config.type === "coupon_fixed") && (
                <FancyInput
                  label="Valor"
                  suffix={
                    reward.config.type === "coupon_percentage" ? "%" : "MXN"
                  }
                  value={reward.config.value || ""}
                  onChange={(v) =>
                    updateConfig(i, {
                      value: toSafeNumber(v),
                    })
                  }
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {showColorModal && (
        <ColorPickerModal
          open={showColorModal}
          onOpenChange={setShowColorModal}
          onSelect={(c) => {
            setColor(c);
          }}
        />
      )}
      <IconPickerModal
        open={showIconModal}
        onOpenChange={setShowIconModal}
        onSelect={(selected) => setIcon(selected)}
        color={color}
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
