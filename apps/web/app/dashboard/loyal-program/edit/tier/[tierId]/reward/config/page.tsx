"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Gift, Percent, HandCoins } from "lucide-react";

import {
  useTierEditor,
  type Reward,
} from "@/context/TierEditorContext";

type RewardConfigType = "gift_card" | "coupon_percentage" | "coupon_fixed";
type RewardType = "ONE_TIME" | "RECURRING";

export default function RewardConfigPage() {
  const router = useRouter();
  const params = useSearchParams();
  const routeParams = useParams();

  const tierId = routeParams?.tierId as string;

  const initialType = params.get("type") as RewardConfigType | null;
  const indexParam = params.get("index");

  const isEditing = indexParam !== null;
  const index = indexParam ? Number(indexParam) : null;

  const { rewards, setRewards } = useTierEditor();

  const [mode, setMode] = useState<"select" | "config">(
    initialType ? "config" : "select"
  );

  const [configType, setConfigType] = useState<RewardConfigType | null>(
    initialType
  );

  const [rewardType, setRewardType] = useState<RewardType>("ONE_TIME");
  const [value, setValue] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");

  // =========================
  // LOAD DATA (desde contexto)
  // =========================
  useEffect(() => {
    if (!isEditing || index === null) return;

    const current = rewards[index];

    if (!current) return;

    setConfigType(current.config.type);
    setMode("config");

    setRewardType(current.type);

    if (current.config.type === "gift_card") {
      setValue(String(current.config.amountCents / 100));
    } else {
      setValue(String(current.config.value));
    }

    if (current.config.expiresInDays) {
      setExpiresInDays(String(current.config.expiresInDays));
    }
  }, [isEditing, index, rewards]);

  // =========================
  // SELECT TYPE
  // =========================
  const options = [
    {
      key: "gift_card",
      title: "Tarjeta de regalo",
      icon: <Gift className="w-5 h-5 text-[#9966FF]" />,
    },
    {
      key: "coupon_percentage",
      title: "Descuento en %",
      icon: <Percent className="w-5 h-5 text-[#9966FF]" />,
    },
    {
      key: "coupon_fixed",
      title: "Descuento fijo",
      icon: <HandCoins className="w-5 h-5 text-[#9966FF]" />,
    },
  ];

  const handleSelect = (type: RewardConfigType) => {
    setConfigType(type);
    setMode("config");
  };

  // =========================
  // SAVE (🔥 SOLO CONTEXTO)
  // =========================
  const handleSave = () => {
    if (!configType) return;

    const numericValue = Number(value);
    const numericExpires = expiresInDays
      ? Number(expiresInDays)
      : undefined;

    if (!numericValue || numericValue <= 0) return;

    const config =
      configType === "gift_card"
        ? {
            type: configType,
            amountCents: numericValue * 100,
            ...(numericExpires ? { expiresInDays: numericExpires } : {}),
          }
        : {
            type: configType,
            value: numericValue,
            ...(numericExpires ? { expiresInDays: numericExpires } : {}),
          };

    const newReward: Reward = {
      type: rewardType,
      config,
    };

    setRewards((prev) => {
      const copy = [...prev];

      if (isEditing && index !== null) {
        copy[index] = newReward;
      } else {
        copy.push(newReward);
      }

      return copy;
    });

    // 🔥 regreso limpio, sin refresh, sin storage
    router.push(`/dashboard/loyal-program/edit/tier/${tierId}`);
  };

  // =========================
  // UI - SELECT MODE
  // =========================
  if (mode === "select") {
    return (
      <div className="min-h-screen bg-white px-6 py-10">
        <div className="max-w-xl mx-auto space-y-10">
          <h1 className="text-4xl font-semibold">
            Elige el tipo de recompensa
          </h1>

          <div className="space-y-4">
            {options.map((opt) => (
              <button
                key={opt.key}
                onClick={() =>
                  handleSelect(opt.key as RewardConfigType)
                }
                className="w-full flex items-center gap-4 p-5 rounded-xl border hover:bg-gray-50"
              >
                <div className="w-10 h-10 rounded-lg bg-[#9966FF]/30 flex items-center justify-center">
                  {opt.icon}
                </div>

                <span className="text-base font-medium">
                  {opt.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // UI - CONFIG MODE
  // =========================
  return (
    <div className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-semibold">
          Configurar recompensa
        </h1>

        {/* TYPE */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setRewardType("ONE_TIME")}
            className={`p-4 border rounded-xl ${
              rewardType === "ONE_TIME"
                ? "bg-black text-white"
                : ""
            }`}
          >
            Una sola vez
          </button>

          <button
            onClick={() => setRewardType("RECURRING")}
            className={`p-4 border rounded-xl ${
              rewardType === "RECURRING"
                ? "bg-black text-white"
                : ""
            }`}
          >
            Recurrente
          </button>
        </div>

        {/* VALUE */}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Valor"
          className="w-full border rounded-xl p-3"
        />

        {/* EXPIRES */}
        <input
          value={expiresInDays}
          onChange={(e) => setExpiresInDays(e.target.value)}
          placeholder="Expira en días"
          className="w-full border rounded-xl p-3"
        />

        <button
          onClick={handleSave}
          className="w-full bg-black text-white py-3 rounded-xl"
        >
          Guardar recompensa
        </button>
      </div>
    </div>
  );
}