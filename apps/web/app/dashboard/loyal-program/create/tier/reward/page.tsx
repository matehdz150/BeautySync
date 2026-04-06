"use client";

import { useRouter } from "next/navigation";
import { Gift, HandCoins, Percent } from "lucide-react";

export default function SelectRewardTypePage() {
  const router = useRouter();

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

  const handleSelect = (type: string) => {
    router.push(
      `/dashboard/loyal-program/create/tier/reward/config?type=${type}`
    );
  };

  

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
              onClick={() => handleSelect(opt.key)}
              className="w-full flex items-center gap-4 p-5 rounded-xl border text-left hover:bg-muted/40 cursor-pointer"
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