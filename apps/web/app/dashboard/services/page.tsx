/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { Filter, Plus, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { useBranch } from "@/context/BranchContext";
import { getServicesByBranch } from "@/lib/services/services";

import { ServicesTable } from "@/components/services/ServicesTable";
import { Button } from "@/components/ui/button";
import { SegmentToggle } from "@/components/services/SegmentToggle";
import { useRouter } from "next/navigation";

export type Service = {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  category: string;
  categoryColor?: string;
  categoryIcon?: string;
  staff: string[];
  popular?: boolean;
};

export default function ServicesPage() {
  const { branch } = useBranch();
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  async function loadServices() {
    if (!branch) return;

    const res = await getServicesByBranch(branch.id);

    const mapped: Service[] = res.map((s: any) => ({
      id: s.id ?? "",
      name: s.name ?? "",
      description: s.description ?? "",
      duration: s.durationMin != null ? `${s.durationMin}m` : "0m",
      price:
        typeof s.priceCents === "number"
          ? `$${(s.priceCents / 100).toFixed(2)}`
          : "$0.00",

      // 👇 ESTO ES LO IMPORTANTE
      category: s.category?.name ?? "Uncategorized",
      categoryColor: s.category?.colorHex ?? "#E5E7EB",
      categoryIcon: s.category?.icon ?? s.category?.Icon ?? null,

      // 👇 De momento staff vacío hasta que hagamos join en backend
      staff: s.staff?.map((p: any) => p.staff?.name) ?? [],
    }));

    setServices(mapped);
    setLoading(false);
  }

  useEffect(() => {
    if (!branch) return;

    async function run() {
      await loadServices();
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch]);


  const filtered = services.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)) &&
      (activeCategory === "all" || s.category === activeCategory)
    );
  });

  return (
    <main className="p-6 space-y-6 mx-auto h-full">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold">Servicios</h1>
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex justify-between">
        <SegmentToggle />

        <div className="flex gap-2">
          <div className="relative w-70 shadow-none">
            <Search className="absolute left-3 top-4.5 -translate-y-1/2 w-4 h-4" />
            <Input
              className="pl-10 shadow-none border rounded-2xl"
              placeholder="Buscar servicios…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className=" border shadow-none">
            Filtros
            <Filter />
          </Button>

          <Button variant={'default'} onClick={()=> router.push("/dashboard/services/serviceaction")} className="shadow-none">
            Añadir servicio
            <Plus/>
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <ServicesTable services={filtered} loading={loading} />
    </main>
  );
}
