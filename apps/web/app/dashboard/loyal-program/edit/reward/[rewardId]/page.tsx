"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  updateBenefitReward,
  getBenefitRewardById,
  BenefitRewardType,
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
import { Service } from "@/lib/services/services";
import { ResourcePickerModal } from "@/components/loyal-program/ResourcePickerModal";

// ===============================
// OPTIONS
// ===============================

const REWARD_OPTIONS = [
  { value: "SERVICE", label: "Servicio" },
  { value: "PRODUCT", label: "Producto" },
  { value: "COUPON", label: "Cupón" },
  { value: "GIFT_CARD", label: "Gift card" },
  { value: "CUSTOM", label: "Personalizado" },
];

// ===============================
// HELPERS
// ===============================

const toSafeNumber = (v: string) => {
  const n = Number(v);
  if (isNaN(n)) return 0;
  return n;
};

const buildRewardName = (
  type: BenefitRewardType,
  config: Record<string, any>,
) => {
  switch (type) {
    case "GIFT_CARD":
      return `Gift card de $${(config.amountCents ?? 0) / 100}`;

    case "COUPON":
      if (config.type === "percentage") {
        return `${config.value}% de descuento`;
      }
      return `$${config.value} de descuento`;

    case "SERVICE":
      return "Servicio gratis";

    case "PRODUCT":
      return "Producto gratis";

    default:
      return "Recompensa";
  }
};

// ===============================
// PAGE
// ===============================

export default function EditRewardPage() {
  const router = useRouter();
  const params = useParams();

  const rewardId = params?.rewardId as string;

  const { branch } = useBranch();
  const branchId = branch?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [type, setType] = useState<BenefitRewardType>("CUSTOM");

  const [form, setForm] = useState({
    pointsCost: 0,
    stock: undefined as number | undefined,
    referenceId: "",
  });

  const [config, setConfig] = useState<Record<string, any>>({});
  const [isActive, setIsActive] = useState(true);

  // ===============================
  // LOAD 🔥
  // ===============================

  useEffect(() => {
    const load = async () => {
      try {
        const reward = await getBenefitRewardById({
          rewardId,
        });

        console.log(reward);

        setType(reward.type);

        setForm({
          pointsCost: reward.pointsCost,
          stock: reward.stock ?? undefined,
          referenceId: reward.referenceId ?? "",
        });

        setConfig(reward.config ?? {});
        setIsActive(reward.isActive);

        if (reward.type === "SERVICE" && reward.service) {
          setSelectedService(reward.service);
        }
      } catch (err) {
        console.error(err);
        alert("Error cargando recompensa");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [branchId, rewardId]);

  // ===============================
  // VALIDATION
  // ===============================

  const validate = () => {
    if (!branchId) return false;

    if (!form.pointsCost || form.pointsCost <= 0) {
      alert("Los puntos deben ser mayores a 0");
      return false;
    }

    if (form.stock !== undefined && form.stock < 0) {
      alert("Stock inválido");
      return false;
    }

    if (["SERVICE", "PRODUCT"].includes(type)) {
      if (!form.referenceId) {
        alert("Selecciona un recurso válido");
        return false;
      }
    }

    if (type === "GIFT_CARD") {
      if (!config.amountCents || config.amountCents <= 0) {
        alert("Monto inválido");
        return false;
      }
    }

    if (type === "COUPON") {
      if (!config.type || !config.value || config.value <= 0) {
        alert("Config de cupón inválido");
        return false;
      }
    }

    return true;
  };

  const isInvalid =
    !branchId ||
    form.pointsCost <= 0 ||
    (["SERVICE", "PRODUCT"].includes(type) && !form.referenceId) ||
    (type === "GIFT_CARD" &&
      (!config.amountCents || config.amountCents <= 0)) ||
    (type === "COUPON" && (!config.type || !config.value || config.value <= 0));

  // ===============================
  // SUBMIT 🔥
  // ===============================

  const handleSubmit = async () => {
    try {
      if (!validate()) return;

      setSaving(true);

      await updateBenefitReward({
        rewardId,
        branchId,
        type,
        name: buildRewardName(type, config),
        pointsCost: form.pointsCost,
        referenceId:
          type === "SERVICE" || type === "PRODUCT" ? form.referenceId : null,
        stock: form.stock,
        config: type === "GIFT_CARD" || type === "COUPON" ? config : undefined,
        isActive,
      });

      router.push("/dashboard/loyal-program");
    } catch (err) {
      console.error(err);
      alert("Error al actualizar recompensa");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10">Cargando recompensa...</div>;

  // ===============================
  // UI
  // ===============================

  return (
    <div className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <Button onClick={() => router.back()} variant="outline">
            Cerrar
          </Button>

          <button
            onClick={handleSubmit}
            disabled={saving || isInvalid}
            className="px-6 py-2 text-sm bg-black text-white rounded-lg disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-semibold">Editar recompensa</h1>

          <p className="text-sm text-indigo-500 mt-2 font-medium">
            {buildRewardName(type, config)}
          </p>
        </div>

        {/* TYPE */}
        <div>
          <label className="text-sm text-gray-600 block mb-2">
            Tipo de recompensa
          </label>

          <RewardTypeDropdown value={type} onChange={setType} />
        </div>

        {/* BASE */}
        <div className="grid grid-cols-2 gap-4">
          <FancyInput
            label="Costo en puntos"
            suffix="pts"
            value={form.pointsCost}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                pointsCost: Math.max(0, toSafeNumber(v)),
              }))
            }
          />

          {type === "SERVICE" && (
            <div>
              <label className="text-sm text-gray-600 block mb-1">
                Servicio
              </label>

              <div className="flex gap-2">
                <Input
                  value={selectedService?.name ?? ""}
                  placeholder="Selecciona un servicio"
                  readOnly
                  onClick={() => setPickerOpen(true)}
                  className="py-6"
                />

              </div>

              {selectedService && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedService.durationMin} min • $
                  {(selectedService.priceCents ?? 0) / 100}
                </p>
              )}
            </div>
          )}

          {["PRODUCT"].includes(type) && (
            <FancyInput
              label="Referencia"
              value={form.referenceId}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  referenceId: v,
                }))
              }
            />
          )}

          {type === "GIFT_CARD" && (
            <FancyInput
              label="Monto gift card"
              suffix="MXN"
              value={config.amountCents ? config.amountCents / 100 : ""}
              onChange={(v) =>
                setConfig({
                  amountCents: Math.max(0, toSafeNumber(v)) * 100,
                })
              }
            />
          )}

          {type === "COUPON" && (
            <>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Tipo</label>

                <Select
                  value={config.type}
                  onValueChange={(v) =>
                    setConfig((prev) => ({ ...prev, type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="fixed">MXN</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <FancyInput
                label="Valor"
                suffix={config.type === "percentage" ? "%" : "MXN"}
                value={config.value ?? ""}
                onChange={(v) =>
                  setConfig((prev) => ({
                    ...prev,
                    value: Math.max(0, toSafeNumber(v)),
                  }))
                }
              />
            </>
          )}
        </div>

        {/* ACTIVE */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span className="text-sm text-gray-600">Activo</span>
        </div>
      </div>
      <ResourcePickerModal
        branchId={branchId}
        type="SERVICE"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(service) => {
          setSelectedService(service);

          setForm((prev) => ({
            ...prev,
            referenceId: service.id,
          }));
        }}
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

// ===============================
// DROPDOWN
// ===============================

function RewardTypeDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: BenefitRewardType) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {REWARD_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
