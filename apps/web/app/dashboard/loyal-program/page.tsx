"use client";

import { useState, useEffect } from "react";
import {
  activateBenefitProgram,
  BenefitReward,
  BenefitRule,
  getBenefitRulesByBranch,
} from "@/lib/services/benefits";
import Image from "next/image";
import { Star } from "lucide-react";
import { useBranch } from "@/context/BranchContext";
import ActiveBenefitsView from "./ActiveBenefitsView";

export default function BenefitsPage() {
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [rules, setRules] = useState<BenefitRule[]>([]);
  const [rewards, setRewards] = useState<BenefitReward[]>([]);

  const [program, setProgram] = useState<{
    exists: boolean;
    isActive: boolean;
    name: string | null;
  } | null>(null);

  const { branch } = useBranch();
  const branchId = branch?.id ?? "";

  // =========================
  // LOAD PROGRAM
  // =========================
  useEffect(() => {
    if (!branchId) return;

    const load = async () => {
      try {
        setLoading(true);

        const data = await getBenefitRulesByBranch(branchId);
        setProgram(data.program);
        setRewards(data.rewards)
        setRules(data.rules);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [branchId]);

  // =========================
  // ACTIVATE
  // =========================
  const handleActivate = async () => {
    try {
      setActivating(true);

      await activateBenefitProgram({
        branchId,
      });

      // 🔥 refresh estado
      const data = await getBenefitRulesByBranch(branchId);
      setProgram(data.program);
      setRules(data.rules);
      setRewards(data.rewards);

      alert("Programa activado 🚀");
    } catch (err) {
      console.error(err);
      alert("Error al activar");
    } finally {
      setActivating(false);
    }
  };

  // =========================
  // LOADING UI
  // =========================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando programa...</p>
      </div>
    );
  }

  // =========================
  // ACTIVE VIEW
  // =========================
  if (program?.isActive) {
    return <ActiveBenefitsView rules={rules} rewards={rewards} />;
  }

  // =========================
  // LANDING (TU DISEÑO ORIGINAL)
  // =========================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white via-gray-100 to-purple-200 px-6">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-10 items-center">
        {/* LEFT */}
        <div>
          {/* Badge */}
          <div className="flex items-center gap-2 mb-6">
            <div className="relative w-8 h-8">
              <Image
                src="/loyal.svg"
                alt="Lealtad"
                fill
                className="object-contain"
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <Star className="w-2 h-2 text-white fill-white drop-shadow-sm" />
              </div>
            </div>

            <span className="text-sm font-medium text-gray-600">
              Sistema de recompensas para clientes
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Haz que tus clientes regresen una y otra vez
          </h1>

          {/* Subtitle */}
          <p className="text-gray-600 mb-6">
            Impulsa tus ingresos con un programa de recompensas diseñado a tu
            medida — motiva visitas frecuentes y aumenta el valor de cada
            compra.
          </p>

          {/* Features */}
          <ul className="space-y-3 text-gray-700 mb-8">
            <li className="flex gap-2">
              <span>✔</span>
              Diseña dinámicas de puntos, niveles y referidos adaptadas a tu
              negocio
            </li>
            <li className="flex gap-2">
              <span>✔</span>
              Incentiva a tus clientes con beneficios exclusivos y promociones
              personalizadas
            </li>
            <li className="flex gap-2">
              <span>✔</span>
              Permite que tus clientes vean su progreso y canjeen recompensas
              fácilmente
            </li>
          </ul>

          {/* Price */}
          <div className="mb-6">
            <p className="text-xl font-semibold">
              $149 MXN por sucursal al mes
            </p>
            <p className="text-sm text-gray-500">Comienza con 7 días gratis</p>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleActivate}
              disabled={activating}
              className="px-6 py-3 rounded-xl bg-black text-white font-medium hover:opacity-90 transition"
            >
              {activating ? "Activando..." : "Activar ahora"}
            </button>

            <button className="text-gray-600 hover:underline">
              Más información
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex justify-center">
          <div className="relative w-72 h-78 rounded-3xl bg-gradient-to-br from-pink-400 via-purple-400 to-orange-300 flex items-center justify-center shadow-2xl overflow-hidden">
            <Image
              src="/loyal.svg"
              alt="Lealtad"
              fill
              className="object-contain opacity-80 mb-5"
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <Star className="w-16 h-16 text-white fill-white drop-shadow-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
