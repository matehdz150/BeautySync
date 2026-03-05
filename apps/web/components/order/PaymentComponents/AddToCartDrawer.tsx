"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { useBranch } from "@/context/BranchContext";
import { usePayment } from "@/context/PaymentContext";
import { getServicesByBranch } from "@/lib/services/services";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/* ---------- UI ---------- */

const TABS = ["Servicios", "Productos", "Membresías", "Gift cards"] as const;
type Tab = (typeof TABS)[number];

/* ---------- TYPES (ajusta si tu backend trae más campos) ---------- */

type Category = {
  id: string;
  colorHex: string;
};

type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  category: Category;
};

function uid() {
  // para permitir agregar el mismo servicio varias veces
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export function AddToCartDrawer({ children }: { children: React.ReactNode }) {
  const { branch } = useBranch();
  const branchId = branch?.id;

  const { addItem } = usePayment();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("Servicios");
  const [search, setSearch] = useState("");

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch sólo cuando se abre y hay branchId
  useEffect(() => {
    if (!open) return;
    if (!branchId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await getServicesByBranch(branchId);
        if (!cancelled) setServices(res ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, branchId]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;

    return services.filter((s) => {
      return (
        s.name.toLowerCase().includes(q) ||
        String(s.durationMin).includes(q) ||
        String((s.priceCents ?? 0) / 100).includes(q)
      );
    });
  }, [services, search]);

  async function addServiceToCart(s: Service) {
    await addItem({
      id: s.id, // referencia al service
      label: s.name,
      type: "service",
      amount: (s.priceCents ?? 0) / 100,
      meta: {
        color: s.category.colorHex ?? "#E5E7EB",
        durationMin: s.durationMin,
        icon: null,
      },
    });

    setOpen(false);
  }

  console.log(filteredServices);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>

      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <div className="flex flex-col h-full px-6 py-5 gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/calendar">
                  Orden de pago
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbPage>Agregar al carrito</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <SheetHeader>
            <SheetTitle className="text-3xl">Agregar al carrito</SheetTitle>
          </SheetHeader>

          {/* HEADER */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar…"
                className="pl-10 py-6 shadow-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* TABS */}
            <div className="inline-flex border rounded-full p-1 gap-1 w-fit">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-4 py-1.5 text-sm rounded-full transition",
                    tab === t ? "bg-black text-white" : "hover:bg-muted",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto pr-1">
            {tab !== "Servicios" ? (
              <div className="h-full grid place-items-center text-center text-sm text-muted-foreground">
                <div>
                  <p className="font-medium text-black">Aún no implementado</p>
                  <p>Por ahora solo “Servicios”.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {loading && (
                  <p className="col-span-2 text-sm text-muted-foreground px-1">
                    Cargando servicios…
                  </p>
                )}

                {!loading && filteredServices.length === 0 && (
                  <p className="col-span-2 text-sm text-muted-foreground px-1">
                    No se encontraron servicios.
                  </p>
                )}

                {!loading &&
                  filteredServices.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => addServiceToCart(s)}
                      className="flex gap-3 border rounded-sm hover:border-black transition text-left"
                    >
                      <div
                        className="w-1 rounded-full py-10"
                        style={{
                          backgroundColor: s.category.colorHex ?? "#E5E7EB",
                        }}
                      />

                      <div className="flex-1 p-2">
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.durationMin} min
                        </p>
                      </div>

                      <p className="font-semibold p-2">
                        ${(s.priceCents ?? 0) / 100}
                      </p>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
