import { Button } from "@/components/ui/button";
import { BenefitReward, BenefitRule } from "@/lib/services/benefits";
import {
  CalendarCheck,
  CirclePlus,
  Coins,
  CreditCard,
  Diamond,
  Gift,
  Handbag,
  Sparkles,
  Star,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import TiersView from "./create/TiersView";

export default function ActiveBenefitsView({
  rules,
  rewards,
  view,
  setView,
}: {
  rules: BenefitRule[];
  rewards: BenefitReward[];
  view: "rules" | "tiers";
  setView: (v: "rules" | "tiers") => void;
}) {
  const router = useRouter();
  return (
    <div className="h-screen overflow-y-auto">
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
          <div className="min-h-screen bg-gray-50 px-6 py-10">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* HEADER */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-semibold">
                    Programa de lealtad
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Configura cómo tus clientes ganan puntos
                  </p>
                </div>

                <button className="px-4 py-2 border rounded-lg text-sm">
                  Opciones
                </button>
              </div>

              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setView("rules")}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    view === "rules"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Reglas
                </button>

                <button
                  onClick={() => setView("tiers")}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    view === "tiers"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Rangos
                </button>
              </div>

              {/* 🔥 BANNER */}
              <div className="relative overflow-hidden rounded-2xl bg-white border p-6 flex items-center justify-between">
                {/* LEFT */}
                <div className="max-w-md">
                  <h2 className="text-lg font-semibold mb-1 text-gray-900">
                    {view === "tiers"
                      ? "Define niveles de fidelidad"
                      : "Mejora la lealtad de tus clientes"}
                  </h2>

                  <p className="text-sm text-gray-500 mb-4">
                    {view === "tiers"
                      ? "Crea niveles como Silver, Gold o VIP para premiar a tus mejores clientes."
                      : "Configura recompensas para incentivar visitas frecuentes y aumentar el valor de cada cliente."}
                  </p>

                  <Button
                    className="px-4 rounded-full text-sm font-medium py-6"
                    variant={"primary"}
                  >
                    {view === "tiers" ? "Crear nivel" : "Configurar ahora"}
                  </Button>
                </div>

                {/* RIGHT IMAGE */}
                <div className="relative w-35 h-35 hidden md:block opacity-70">
                  <Image
                    src='/loyal.svg'
                    alt="Banner"
                    fill
                    className="object-contain"
                  />

                  {/* ICON OVERLAY */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {view === "tiers" ? (<Diamond className="w-12 h-12 text-white fill-purple-500 drop-shadow-md" />
                    ) : (
                      <Coins className="w-12 h-12 text-white fill-purple-500 drop-shadow-md" />
                    )}
                  </div>
                </div>
              </div>

              {/* RULES */}
              {view === "rules" && (
                <>
                  <div>
                    <h3 className="text-lg font-bold mb-1">
                      Formas de ganar puntos
                    </h3>

                    <p className="text-sm text-gray-500 mb-4">
                      Configura cómo tus clientes acumulan puntos
                    </p>

                    <div className="space-y-3">
                      {rules.map((rule) => (
                        <RuleCard key={rule.id} rule={rule} />
                      ))}
                      <Button
                        variant="outline"
                        className="flex gap-2 shadow-none rounded-full px-3"
                        onClick={() => router.push("loyal-program/create/earn")}
                      >
                        Agregar Regla
                        <CirclePlus />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">
                      Formas de gastar puntos
                    </h3>

                    <p className="text-sm text-gray-500 mb-4">
                      Configura cómo tus clientes gastan puntos
                    </p>

                    <div className="space-y-3">
                      {rewards.map((reward) => (
                        <RewardCard key={reward.id} reward={reward} />
                      ))}
                      <Button
                        variant="outline"
                        className="flex gap-2 shadow-none rounded-full py-5 px-3"
                        onClick={() =>
                          router.push("loyal-program/create/reward")
                        }
                      >
                        Agregar recompensa
                        <CirclePlus />
                      </Button>
                    </div>
                  </div>
                </>
              )}
              {view === "tiers" && (
                <TiersView/>
              )}
              {/* RULES */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RuleCard({ rule }: { rule: BenefitRule }) {
  const config = rule.config as any;

  const getTitle = () => {
    switch (rule.type) {
      case "BOOKING_COUNT":
        return "Reservas realizadas";
      case "SPEND_ACCUMULATED":
        return "Gasto acumulado";
      case "REVIEW_CREATED":
        return "Dejar reseña";
      case "ONLINE_PAYMENT":
        return "Pago en línea";
      case "FIRST_BOOKING":
        return "Primera reserva";
      case "REFERRAL":
        return "Referir amigo";
      default:
        return "Regla";
    }
  };

  const getDescription = () => {
    switch (rule.type) {
      case "BOOKING_COUNT":
        return `${config.count} reservas completadas = ${config.points} puntos`;

      case "SPEND_ACCUMULATED":
        return `${config.thresholdCents / 100} MXN = ${config.points} puntos`;

      case "REVIEW_CREATED":
        return `${config.points} puntos por reseña`;

      case "ONLINE_PAYMENT":
        return `${config.points} puntos por pago en línea`;

      case "FIRST_BOOKING":
        return `${config.points} puntos por primera reserva`;

      case "REFERRAL":
        return `${config.points} puntos por referido`;

      default:
        return "";
    }
  };

  const getIcon = () => {
    switch (rule.type) {
      case "BOOKING_COUNT":
        return <CalendarCheck className="w-5 h-5" />;

      case "SPEND_ACCUMULATED":
        return <Wallet className="w-5 h-5" />;

      case "REVIEW_CREATED":
        return <Star className="w-5 h-5" />;

      case "ONLINE_PAYMENT":
        return <CreditCard className="w-5 h-5" />;

      case "FIRST_BOOKING":
        return <Sparkles className="w-5 h-5" />;

      case "REFERRAL":
        return <Users className="w-5 h-5" />;

      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const getIconStyles = () => {
    return "bg-gradient-to-br from-purple-400 via-pink-400 to-orange-200 text-white";
  };

  return (
    <div className="bg-white rounded-xl border p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* ICON */}
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${getIconStyles()}`}
        >
          {getIcon()}
        </div>

        {/* TEXT */}
        <div>
          <p className="font-medium">{getTitle()}</p>
          <p className="text-sm text-gray-500">{getDescription()}</p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        <button className="px-4 py-3 border rounded-full text-sm">
          Acciones
        </button>
      </div>
    </div>
  );
}

function RewardCard({ reward }: { reward: BenefitReward }) {
  const getIcon = () => {
    switch (reward.type) {
      case "SERVICE":
        return <Sparkles className="w-5 h-5" />;

      case "PRODUCT":
        return <Handbag className="w-5 h-5" />;

      case "COUPON":
        return <Ticket className="w-5 h-5" />;

      case "GIFT_CARD":
        return <Gift className="w-5 h-5" />;

      case "CUSTOM":
        return <Star className="w-5 h-5" />;

      default:
        return <Gift className="w-5 h-5" />;
    }
  };

  const getIconStyles = () => {
    // 🔥 diferente a rules
    return "bg-gradient-to-br from-green-400 via-emerald-400 to-teal-300 text-white";
  };

  return (
    <div className="bg-white rounded-xl border p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* ICON */}
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${getIconStyles()}`}
        >
          {getIcon()}
        </div>

        {/* TEXT */}
        <div>
          <p className="font-medium">{reward.name}</p>
          <p className="text-sm text-gray-500">{reward.pointsCost} puntos</p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        <button className="px-4 py-3 border rounded-full text-sm">
          Acciones
        </button>
      </div>
    </div>
  );
}
