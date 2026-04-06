"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

import {
  updateBenefitRule,
  getBenefitRulesByBranch,
  BenefitRuleType,
  BenefitRule,
  getBenefitRuleById,
} from "@/lib/services/benefits";

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
// DEFAULT CONFIG
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

export default function EditEarnRulePage() {
  const router = useRouter();
  const params = useParams();

  const ruleId = params?.ruleId as string;

  const { branch } = useBranch();
  const branchId = branch?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<BenefitRuleType>("BOOKING_COUNT");
  const [config, setConfig] = useState<Record<string, any>>({});

  const [isActive, setIsActive] = useState(true);

  // ===============================
  // LOAD RULE
  // ===============================

  useEffect(() => {
    const load = async () => {
      if (!branchId || !ruleId) return;

      try {
        const rule = await getBenefitRuleById({
          ruleId,
          branchId,
        });

        setType(rule.type);
        setConfig(rule.config || DEFAULT_CONFIG[rule.type]);
        setIsActive(rule.isActive);
      } catch (err) {
        console.error(err);
        alert("Regla no encontrada o error cargando");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [branchId, ruleId]);

  // ===============================
  // VALIDATION
  // ===============================

  const validateConfig = () => {
    if (!branchId) return false;

    switch (type) {
      case "BOOKING_COUNT":
        return config.count > 0 && config.points > 0;

      case "SPEND_ACCUMULATED":
        return config.thresholdCents > 0 && config.points > 0;

      default:
        return config.points > 0;
    }
  };

  const isInvalid =
    !branchId ||
    !config ||
    Object.values(config).some((v) => v <= 0 || v === undefined);

  // ===============================
  // SUBMIT
  // ===============================

  const handleSubmit = async () => {
    try {
      if (!validateConfig()) {
        alert("Config inválida");
        return;
      }

      setSaving(true);

      await updateBenefitRule({
        ruleId,
        branchId,
        type,
        config,
        isActive,
      });

      router.push("/dashboard/loyal-program");
    } catch (err) {
      console.error(err);
      alert("Error actualizando regla");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10">Cargando regla...</div>;

  // ===============================
  // UI
  // ===============================

  return (
    <div className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <Button onClick={() => router.back()} variant="outline" className="py-6 shadow-none">
            Cerrar
          </Button>

          <button
            onClick={handleSubmit}
            disabled={saving || isInvalid}
            className="px-6 py-2 bg-black text-white rounded-lg disabled:opacity-50 shadow-none"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        {/* HEADER */}
        <div className="flex- flex-col gap-5">
          <h1 className="text-3xl font-semibold">Editar regla</h1>
          <p className="text-muted-foreground text-sm">Define cuántos puntos ganan los clientes al completar cierto número de reservas.</p>
        </div>

        {/* TYPE */}
        <RuleTypeDropdown
          value={type}
          onChange={(newType) => {
            setType(newType);
            setConfig({ ...DEFAULT_CONFIG[newType] });
          }}
        />

        {/* CONFIG */}

        {type === "BOOKING_COUNT" && (
          <div className="grid grid-cols-2 gap-4">
            <FancyInput
              label="Puntos"
              value={config.points ?? ""}
              onChange={(v) =>
                setConfig((p) => ({
                  ...p,
                  points: toSafeNumber(v),
                }))
              }
            />

            <FancyInput
              label="Reservas"
              value={config.count ?? ""}
              onChange={(v) =>
                setConfig((p) => ({
                  ...p,
                  count: toSafeNumber(v),
                }))
              }
            />
          </div>
        )}

        {type === "SPEND_ACCUMULATED" && (
          <div className="grid grid-cols-2 gap-4">
            <FancyInput
              label="MXN"
              value={config.thresholdCents / 100 || ""}
              onChange={(v) =>
                setConfig((p) => ({
                  ...p,
                  thresholdCents: toSafeNumber(v) * 100,
                }))
              }
            />

            <FancyInput
              label="Puntos"
              value={config.points ?? ""}
              onChange={(v) =>
                setConfig((p) => ({
                  ...p,
                  points: toSafeNumber(v),
                }))
              }
            />
          </div>
        )}

        {(type === "REVIEW_CREATED" ||
          type === "ONLINE_PAYMENT" ||
          type === "FIRST_BOOKING" ||
          type === "REFERRAL") && (
          <FancyInput
            label="Puntos"
            value={config.points ?? ""}
            onChange={(v) =>
              setConfig((p) => ({
                ...p,
                points: toSafeNumber(v),
              }))
            }
          />
        )}

        {/* ACTIVE TOGGLE */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span className="text-sm text-gray-600">Regla activa</span>
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
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm text-gray-600 block mb-1">{label}</label>

      <Input
        value={value === 0 ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-xl px-4 py-6 text-sm"
      />
    </div>
  );
}

// ===============================
// DROPDOWN
// ===============================

function RuleTypeDropdown({
  value,
  onChange,
}: {
  value: BenefitRuleType;
  onChange: (v: BenefitRuleType) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full rounded-xl px-4 py-6 text-sm">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {RULE_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
