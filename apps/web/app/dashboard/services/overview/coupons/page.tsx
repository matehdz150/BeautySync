"use client";

import { useEffect, useMemo, useState } from "react";
import { getCouponsByBranch, Coupon } from "@/lib/services/coupons";
import { useBranch } from "@/context/BranchContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Search, Plus, MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { CouponCard } from "./CouponCard";
import { useCouponDraft } from "@/context/CouponDraftContext";
import { CreateCouponSheet } from "@/components/coupons/CreateCouponSheet";
import { cn } from "@/lib/utils";

/* =========================
   HELPERS
========================= */

function formatMoney(cents: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getCouponStatus(coupon: Coupon) {
  const isExpired =
    coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now();

  if (isExpired) {
    return {
      label: "Expirado",
      className: "bg-red-50 text-red-700 border border-red-200",
    };
  }

  if (!coupon.isActive) {
    return {
      label: "Inactivo",
      className: "bg-zinc-100 text-zinc-700 border border-zinc-200",
    };
  }

  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return {
      label: "Agotado",
      className: "bg-amber-50 text-amber-700 border border-amber-200",
    };
  }

  return {
    label: "Activo",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };
}

/* =========================
   COMPONENTS
========================= */

function CouponVisual({
  coupon,
  branchName,
}: {
  coupon: Coupon;
  branchName?: string | null;
}) {
  const isPercentage = coupon.type === "percentage";

  const value = isPercentage
    ? `${coupon.value}%`
    : formatMoney(coupon.value).replace(".00", "");

  return (
    <div className="flex items-center gap-3 min-w-[240px]">
      <div
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm border",
          isPercentage
            ? "bg-gradient-to-br from-indigo-500 to-violet-500 border-indigo-200"
            : "bg-gradient-to-br from-sky-500 to-cyan-500 border-sky-200"
        )}
      >
        {isPercentage ? "%" : "$"}
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold truncate">
          {coupon.code}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {branchName ?? "Sucursal"} · {value}
        </span>
      </div>
    </div>
  );
}

function CouponType({ type }: { type: Coupon["type"] }) {
  return (
    <span
      className={cn(
        "text-xs px-2 py-1 rounded-full border",
        type === "percentage"
          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
          : "bg-sky-50 text-sky-700 border-sky-200"
      )}
    >
      {type === "percentage" ? "Porcentaje" : "Monto fijo"}
    </span>
  );
}

function CouponValue({ coupon }: { coupon: Coupon }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm font-semibold">
        {coupon.type === "percentage"
          ? `${coupon.value}%`
          : formatMoney(coupon.value)}
      </span>
      <span className="text-xs text-muted-foreground">
        descuento
      </span>
    </div>
  );
}

function CouponUsage({ coupon }: { coupon: Coupon }) {
  const limit = coupon.usageLimit;
  const used = coupon.usedCount;

  const percent =
    limit && limit > 0 ? Math.min((used / limit) * 100, 100) : null;

  return (
    <div className="flex flex-col gap-1 w-full max-w-[120px]">
      <div className="flex justify-between text-xs">
        <span className="font-medium">
          {limit != null ? `${used}/${limit}` : used}
        </span>
        <span className="text-muted-foreground">usos</span>
      </div>

      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        {percent != null && (
          <div
            className="h-full bg-zinc-900 transition-all"
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
    </div>
  );
}

/* =========================
   PAGE
========================= */

export default function CouponsPage() {
  const { branch } = useBranch();
  const { open } = useCouponDraft();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    if (!branch) return;

    try {
      setLoading(true);
      const data = await getCouponsByBranch(branch.id);
      setCoupons(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [branch]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return coupons.filter((c) =>
      c.code.toLowerCase().includes(q)
    );
  }, [coupons, search]);

  if (loading) {
    return <div className="p-6">Cargando cupones...</div>;
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Cupones
          </h1>
          <p className="text-sm text-muted-foreground">
            Crea y administra descuentos para tu sucursal.
          </p>
        </div>

        <Button className="rounded-full h-11 px-5" onClick={open}>
          <Plus className="mr-2 w-4 h-4" />
          Crear cupón
        </Button>
      </div>

      {/* SEARCH */}
      <div className="flex items-center justify-between">
        <div className="relative w-[340px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cupón..."
            className="pl-10 rounded-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="text-sm text-muted-foreground">
          {filtered.length} resultados
        </span>
      </div>

      {/* EMPTY */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border py-16 text-center">
          <CouponCard discount="20%" />
          <p className="mt-6 font-medium">No tienes cupones</p>
          <p className="text-sm text-muted-foreground">
            Crea el primero para empezar
          </p>
        </div>
      )}

      {/* TABLE */}
      {filtered.length > 0 && (
        <div className="rounded-2xl overflow-hidden bg-white">
          {/* HEADER */}
          <div className="grid grid-cols-[minmax(240px,2fr)_120px_120px_160px_120px_56px] px-6 py-4 text-xs uppercase text-muted-foreground border-b">
            <span>Cupón</span>
            <span className="text-center">Tipo</span>
            <span className="text-center">Valor</span>
            <span className="text-center">Uso</span>
            <span className="text-center">Estado</span>
            <span></span>
          </div>

          {/* ROWS */}
          {filtered.map((coupon) => {
            const status = getCouponStatus(coupon);

            return (
              <div
                key={coupon.id}
                className="grid grid-cols-[minmax(140px,2fr)_120px_120px_160px_120px_56px] items-center px-6 py-5 border-b hover:bg-zinc-50 transition"
              >
                <CouponVisual
                  coupon={coupon}
                  branchName={branch?.name}
                />

                <div className="flex justify-center">
                  <CouponType type={coupon.type} />
                </div>

                <div className="flex justify-center">
                  <CouponValue coupon={coupon} />
                </div>

                <div className="flex justify-center">
                  <CouponUsage coupon={coupon} />
                </div>

                <div className="flex justify-center">
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      status.className
                    )}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-9 w-9 rounded-lg hover:bg-zinc-100 flex items-center justify-center">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Duplicar</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Desactivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateCouponSheet onCreated={load} />
    </div>
  );
}