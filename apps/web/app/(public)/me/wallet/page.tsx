// app/(public)/benefits/page.tsx

"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Diamond, PlusCircle } from "lucide-react";

import { getUserWallet } from "@/lib/services/public/benefits";
import type {
  UserWalletItem,
  UserWalletResponse,
} from "@/lib/services/public/benefits";
import { CategoryIcon } from "@/components/shared/Icon";

export default function BenefitsPage() {
  const [wallet, setWallet] = useState<UserWalletResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    getUserWallet()
      .then((data) => {
        console.log(data);
        setWallet(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const branches = wallet?.branches ?? [];
  const totalGiftCardCents = wallet?.global.totalGiftCardCents ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <p className="text-sm text-gray-500">Cargando beneficios...</p>
      </div>
    );
  }

  if (!branches.length) {
    return (
      <div className="min-h-screen bg-white p-6">
        <p className="text-sm text-gray-500">
          Aún no tienes beneficios acumulados
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* =====================
          TOP CARD
      ===================== */}
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#8d00ff] via-[#b53df7] to-[#c9d8ff] px-6 pb-8 pt-6 text-white">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mb-8 inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold leading-none tracking-tight">
            $
            {(totalGiftCardCents / 100).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h1>

          <p className="text-xl text-white/85">Balance total</p>
        </div>

        <button
          type="button"
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/80 px-5 py-3 text-lg font-medium text-white backdrop-blur-sm"
        >
          <PlusCircle className="h-5 w-5" />
          Agregar
        </button>
      </div>

      {/* =====================
          LIST
      ===================== */}
      <div className="py-2">
        <div className="space-y-6">
          {branches.map((item) => (
            <WalletBranchRow key={item.branch.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WalletBranchRow({ item }: { item: UserWalletItem }) {
  const cover = item.branch.coverUrl;
  const points = item.points;
  const hasGiftCard = item.benefits.totalGiftCardCents > 0;
  const bestCoupon = item.benefits.bestCoupon;

  const rightValue = hasGiftCard
    ? `$${(item.benefits.totalGiftCardCents / 100).toLocaleString("en-US", {
        maximumFractionDigits: 0,
      })}`
    : "$0";

  return (
    <div className="flex items-center gap-4 bg-white py-4 px-5 rounded-lg">
      {/* image */}
      <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#6a6cff] to-[#b26bff]">
        {cover ? (
          <img
            src={cover}
            alt={item.branch.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
            {item.branch.name.slice(0, 1)}
          </div>
        )}
      </div>

      {/* center */}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[18px] font-medium text-[#222]">
          {item.branch.name}
        </h2>

        <div className="mt-1 flex items-center gap-2 text-[15px]">
          {/* POINTS */}
          {points > 0 && (
            <>
              <Diamond className="h-4 w-4 text-[#8b5cf6]" />
              <span className="font-medium text-[#8b5cf6]">
                {points.toLocaleString("en-US")} puntos
              </span>
            </>
          )}

          {/* TIER */}
          {item.tier && (
            <div
              className="ml-1 px-3 py-2 rounded-full text-xs font-medium flex items-center gap-1"
              style={{
                background: item.tier.color ? `#${item.tier.color}30` : "#eee",
                color: item.tier.color ? `#${item.tier.color}` : "#666",
              }}
            >
              <CategoryIcon name={item.tier.icon} className="w-3 h-3" />
              <span>{item.tier.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* right */}
      <div className="text-right">
        <p className="text-[20px] font-medium leading-none text-[#222]">
          {rightValue}
        </p>
        <p className="mt-1 text-[15px] text-[#9a9a9a]">MXN</p>
      </div>
    </div>
  );
}
