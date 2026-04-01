"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBenefitRule, BenefitRuleType } from "@/lib/services/benefits";
import { useBranch } from "@/context/BranchContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ===============================
// TYPES
// ===============================

const DEFAULT_CONFIG: Record<BenefitRuleType, any> = {
  BOOKING_COUNT: { count: 10, points: 100 },
  SPEND_ACCUMULATED: { thresholdCents: 10000, points: 100 },
  REVIEW_CREATED: { points: 50 },
  ONLINE_PAYMENT: { points: 50 },
  FIRST_BOOKING: { points: 100 },
  REFERRAL: { points: 200 },
};

const RULE_OPTIONS = [
  { value: "BOOKING_COUNT", label: "Reservas" },
  { value: "SPEND_ACCUMULATED", label: "Gasto acumulado" },
  { value: "REVIEW_CREATED", label: "Reseñas" },
  { value: "ONLINE_PAYMENT", label: "Pago online" },
  { value: "FIRST_BOOKING", label: "Primera reserva" },
  { value: "REFERRAL", label: "Referidos" },
];

type Mode = "create" | "edit";

// ===============================
// HELPERS
// ===============================

const toSafeNumber = (v: string) => {
  const n = Number(v);
  if (isNaN(n)) return 0;
  return n;
};

// ===============================
// PAGE
// ===============================

export default function CreateEarnRulePage() {
  const router = useRouter();
  const { branch } = useBranch();

  const branchId = branch?.id ?? "";

  const [mode] = useState<Mode>("create");
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState<BenefitRuleType>("BOOKING_COUNT");

  const [config, setConfig] = useState<Record<string, any>>(
    DEFAULT_CONFIG["BOOKING_COUNT"],
  );

  // ===============================
  // VALIDATION
  // ===============================

  const validateConfig = () => {
    if (!branchId) {
      alert("Sucursal inválida");
      return false;
    }

    if (!config || typeof config !== "object") {
      alert("Configuración inválida");
      return false;
    }

    switch (type) {
      case "BOOKING_COUNT":
        if (!config.count || config.count <= 0) {
          alert("El número de reservas debe ser mayor a 0");
          return false;
        }
        if (!config.points || config.points <= 0) {
          alert("Los puntos deben ser mayores a 0");
          return false;
        }
        break;

      case "SPEND_ACCUMULATED":
        if (!config.thresholdCents || config.thresholdCents <= 0) {
          alert("El monto debe ser mayor a 0");
          return false;
        }
        if (!config.points || config.points <= 0) {
          alert("Los puntos deben ser mayores a 0");
          return false;
        }
        break;

      case "REVIEW_CREATED":
      case "ONLINE_PAYMENT":
      case "FIRST_BOOKING":
      case "REFERRAL":
        if (!config.points || config.points <= 0) {
          alert("Los puntos deben ser mayores a 0");
          return false;
        }
        break;

      default:
        alert("Tipo de regla inválido");
        return false;
    }

    return true;
  };

  // ===============================
  // DISABLED STATE
  // ===============================

  const isInvalid =
    !branchId ||
    !config ||
    Object.values(config).some((v) => v === undefined || v === null || v <= 0);

  // ===============================
  // SUBMIT
  // ===============================

  const handleSubmit = async () => {
    try {
      if (!validateConfig()) return;

      setLoading(true);

      await createBenefitRule({
        branchId,
        type,
        config,
      });

      router.push("/dashboard/loyal-program");
    } catch (err) {
      console.error(err);
      alert("Error al crear regla");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // UI
  // ===============================

  return (
    <div className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* TOP ACTIONS */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={() => router.back()}
            className="px-6 py-6 text-sm border rounded-lg shadow-none"
            variant={"outline"}
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
          <h1 className="text-3xl font-semibold leading-tight">
            Editar puntos por reservas completadas
          </h1>

          <p className="text-gray-500 text-sm mt-2">
            Define cuántos puntos ganan los clientes al completar cierto número
            de reservas.
          </p>

          <button className="text-sm text-indigo-500 mt-1 hover:underline">
            Más información
          </button>
        </div>

        {/* TYPE SELECT */}
        <div>
          <label className="text-sm text-gray-600 block mb-2">
            Tipo de regla
          </label>

          <RuleTypeDropdown
            value={type}
            onChange={(newType) => {
              setType(newType);
              setConfig({ ...DEFAULT_CONFIG[newType] });
            }}
          />
        </div>

        {/* CONFIG */}

        {type === "BOOKING_COUNT" && (
          <div className="grid grid-cols-2 gap-4">
            <FancyInput
              label="Los clientes ganan"
              suffix="puntos"
              value={config.points ?? ""}
              onChange={(v) =>
                setConfig((prev) => ({
                  ...prev,
                  points: Math.max(0, toSafeNumber(v)),
                }))
              }
            />

            <FancyInput
              label="Por cada"
              suffix="reservas"
              value={config.count ?? ""}
              onChange={(v) =>
                setConfig((prev) => ({
                  ...prev,
                  count: Math.max(0, toSafeNumber(v)),
                }))
              }
            />
          </div>
        )}

        {type === "SPEND_ACCUMULATED" && (
          <div className="grid grid-cols-2 gap-4">
            <FancyInput
              label="Por cada"
              suffix="MXN"
              value={
                config.thresholdCents
                  ? Math.floor(config.thresholdCents / 100)
                  : ""
              }
              onChange={(v) =>
                setConfig((prev) => ({
                  ...prev,
                  thresholdCents: Math.max(0, toSafeNumber(v)) * 100, // 🔥 aquí está el fix
                }))
              }
            />

            <FancyInput
              label="Puntos"
              suffix="pts"
              value={config.points ?? ""}
              onChange={(v) =>
                setConfig((prev) => ({
                  ...prev,
                  points: Math.max(0, toSafeNumber(v)),
                }))
              }
            />
          </div>
        )}

        {(type === "REVIEW_CREATED" ||
          type === "ONLINE_PAYMENT" ||
          type === "FIRST_BOOKING" ||
          type === "REFERRAL") && (
          <div className="max-w-xs">
            <FancyInput
              label="Puntos otorgados"
              suffix="pts"
              value={config.points ?? ""}
              onChange={(v) =>
                setConfig((prev) => ({
                  ...prev,
                  points: Math.max(0, toSafeNumber(v)),
                }))
              }
            />
          </div>
        )}

        {/* EXTRA SETTINGS */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            Límites de obtención
          </h3>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" />
            Definir monto mínimo de reserva
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" />
            Limitar cuántas veces se puede ganar esta recompensa
          </label>
        </div>
      </div>
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
          className="w-full border rounded-xl px-4 py-6 text-sm pr-16 shadow-none"
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

// ===============================
// DROPDOWN
// ===============================

export function RuleTypeDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full rounded-xl px-4 py-6 text-sm">
        <SelectValue placeholder="Selecciona un tipo de regla" />
      </SelectTrigger>

      <SelectContent className="rounded-xl">
        {RULE_OPTIONS.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="text-sm"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
