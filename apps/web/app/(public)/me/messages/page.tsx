// app/(public)/benefits/page.tsx

"use client";

import { useEffect, useState } from "react";
import { getUserWallet } from "@/lib/services/public/benefits";

import type { UserWalletItem } from "@/lib/services/public/benefits";

export default function BenefitsPage() {
  const [wallet, setWallet] = useState<UserWalletItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    getUserWallet()
      .then((data) => {
        console.log(data)
        setWallet(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Cargando beneficios...</p>
      </div>
    );
  }

  if (!wallet.length) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">
          Aún no tienes beneficios acumulados
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Tus beneficios</h1>

      {/* =====================
          LISTA DE BRANCHES
      ===================== */}
      <div className="space-y-4">
        {wallet.map((item) => (
          <div
            key={item.branch.id}
            className="border rounded-2xl p-5 bg-white shadow-sm space-y-4"
          >
            {/* HEADER */}
            <div className="flex items-center gap-4">
              {item.branch.coverUrl && (
                <img
                  src={item.branch.coverUrl}
                  className="w-14 h-14 rounded-xl object-cover"
                />
              )}

              <div>
                <h2 className="font-semibold">{item.branch.name}</h2>
                <p className="text-sm text-gray-500">
                  {item.branch.address}
                </p>
              </div>
            </div>

            {/* POINTS */}
            <div>
              <p className="text-xs text-gray-500">
                Puntos acumulados
              </p>
              <p className="text-2xl font-semibold">
                {item.points}
              </p>
            </div>

            {/* BENEFITS SUMMARY */}
            <div className="space-y-1">
              {/* Gift card */}
              {item.benefits.hasGiftCard ? (
                <p className="text-sm text-green-600">
                  💳 $
                  {(
                    item.benefits.totalGiftCardCents / 100
                  ).toLocaleString("es-MX")}{" "}
                  disponibles
                </p>
              ) : (
                <p className="text-sm text-gray-400">
                  Sin gift cards
                </p>
              )}

              {/* Coupon */}
              {item.benefits.bestCoupon ? (
                <p className="text-sm text-blue-600">
                  🎟{" "}
                  {item.benefits.bestCoupon.type === "percentage"
                    ? `${item.benefits.bestCoupon.value}% descuento`
                    : `$${(
                        item.benefits.bestCoupon.value / 100
                      ).toLocaleString("es-MX")} MXN`}
                </p>
              ) : (
                <p className="text-sm text-gray-400">
                  Sin cupones
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}