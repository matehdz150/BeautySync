"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Diamond, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { getBranchTiers } from "@/lib/services/benefits";
import { useBranch } from "@/context/BranchContext";
import { CategoryIcon } from "@/components/shared/Icon";
import { getTierGradient } from "@/lib/helpers/colors/colors";

export interface TierItem {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  minPoints: number;
}

export default function TiersView() {
  const router = useRouter();
  const { branch } = useBranch();

  const branchId = branch?.id ?? "";

  const [tiers, setTiers] = useState<TierItem[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD TIERS
  // =========================
  useEffect(() => {
    if (!branchId) return;

    const load = async () => {
      try {
        setLoading(true);

        const data = await getBranchTiers(branchId);
        setTiers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [branchId]);

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="bg-white border rounded-xl p-4">
        <p className="text-sm text-gray-500">Cargando niveles...</p>
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div>
        <h3 className="text-lg font-bold mb-1">Niveles de fidelidad</h3>

        <p className="text-sm text-gray-500 mb-4">
          Define niveles según puntos acumulados
        </p>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {!tiers.length && (
          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm text-gray-500">
              Aún no hay niveles configurados
            </p>
          </div>
        )}

        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="bg-white rounded-xl border p-4 flex items-center justify-between"
          >
            {/* LEFT */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center`}
                style={{
                  background: tier.color ? `#${tier.color}30` : "#eee",
                }}
              >
                <div
                  className={`w-full h-full rounded-lg flex items-center justify-center`}
                >
                  {tier.icon ? (
                    <CategoryIcon
                      name={tier.icon}
                      className="w-5 h-5"
                      style={{
                        color: tier.color ? `#${tier.color}` : "#666", // stroke
                        fill: tier.color ? `#${tier.color}40` : "transparent", // 🔥 más claro
                      }}
                    />
                  ) : (
                    <Diamond
                      className="w-5 h-5"
                      style={{
                        color: tier.color ? `#${tier.color}` : "#666",
                        fill: tier.color ? `#${tier.color}40` : "transparent",
                      }}
                    />
                  )}
                </div>
              </div>

              <div>
                <p className="font-medium">{tier.name}</p>
                <p className="text-sm text-gray-500">
                  Desde {tier.minPoints.toLocaleString("es-MX")} pts
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <button className="px-4 py-2 border rounded-full text-sm">
              Acciones
            </button>
          </div>
        ))}

        {/* CREATE */}
        <Button
          className="flex gap-2 rounded-full px-3 py-5 shadow-none"
          variant={"outline"}
          onClick={() => router.push("loyal-program/create/tier")}
        >
          Crear nivel
          <Plus />
        </Button>
      </div>
    </div>
  );
}
