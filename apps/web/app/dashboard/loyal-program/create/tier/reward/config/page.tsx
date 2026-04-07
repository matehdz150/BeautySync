"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useTierDraft } from "../../TierDraftContext";

type RewardConfigType = "gift_card" | "coupon_percentage" | "coupon_fixed";
type TierRewardType = "ONE_TIME" | "RECURRING";

export default function RewardConfigPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { addReward } = useTierDraft();

  const configType = params.get("type") as RewardConfigType | null;

  const [rewardType, setRewardType] = useState<TierRewardType>("ONE_TIME");
  const [value, setValue] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");

  const isGiftCard = configType === "gift_card";

  const handleSave = () => {
    if (!configType) return;

    const numericValue = Number(value);
    const numericExpires = expiresInDays ? Number(expiresInDays) : undefined;

    if (!numericValue || numericValue <= 0) return;

    const config =
      configType === "gift_card"
        ? {
            type: configType,
            amountCents: numericValue * 100,
            ...(numericExpires && numericExpires > 0
              ? { expiresInDays: numericExpires }
              : {}),
          }
        : {
            type: configType,
            value: numericValue,
            ...(numericExpires && numericExpires > 0
              ? { expiresInDays: numericExpires }
              : {}),
          };

    addReward({
      type: rewardType,
      config,
    });

    router.push("/dashboard/loyal-program/create/tier");
  };

  const getTitle = () => {
    switch (configType) {
      case "gift_card":
        return "Configurar tarjeta de regalo";
      case "coupon_percentage":
        return "Configurar descuento (%)";
      case "coupon_fixed":
        return "Configurar descuento fijo";
      default:
        return "Configurar recompensa";
    }
  };

  const getPlaceholder = () => {
    if (configType === "gift_card") return "Monto en MXN";
    if (configType === "coupon_percentage") return "Ej: 10";
    return "Monto en MXN";
  };

  const getHelperText = () => {
    if (configType === "gift_card")
      return "Se convertirá a centavos automáticamente";
    if (configType === "coupon_percentage")
      return "Ingresa el porcentaje de descuento";
    return "Ingresa el monto fijo del descuento en MXN";
  };

  return (
    <div className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold">{getTitle()}</h1>
          <p className="text-sm text-gray-500">
            Define cómo se entregará esta recompensa al subir de nivel.
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm text-black block">Tipo de entrega</label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRewardType("ONE_TIME")}
              className={`rounded-xl border p-4 text-left transition ${
                rewardType === "ONE_TIME"
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white text-black hover:bg-gray-50"
              }`}
            >
              <p className="font-medium">Una sola vez</p>
              <p
                className={`text-sm mt-1 ${
                  rewardType === "ONE_TIME" ? "text-white/80" : "text-gray-500"
                }`}
              >
                Se otorga solo la primera vez que el cliente llega a este nivel.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRewardType("RECURRING")}
              className={`rounded-xl border p-4 text-left transition ${
                rewardType === "RECURRING"
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white text-black hover:bg-gray-50"
              }`}
            >
              <p className="font-medium">Recurrente</p>
              <p
                className={`text-sm mt-1 ${
                  rewardType === "RECURRING" ? "text-white/80" : "text-gray-500"
                }`}
              >
                Se otorga en todas las compras futuras del cliente.
              </p>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-black block">
            {isGiftCard ? "Monto" : "Valor"}
          </label>

          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={getPlaceholder()}
            className="w-full border rounded-xl p-3"
            inputMode="numeric"
          />

          <p className="text-xs text-gray-500">{getHelperText()}</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-700 block">
            Expira en días (opcional)
          </label>

          <input
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            placeholder="Ej: 30"
            className="w-full border rounded-xl p-3"
            inputMode="numeric"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!value || !configType}
          className="w-full bg-black text-white py-3 rounded-xl disabled:opacity-50"
        >
          Guardar recompensa
        </button>
      </div>
    </div>
  );
}
