"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { useBranch } from "@/context/BranchContext";
import {
  deleteProduct,
  getProductsByBranch,
  type Product,
} from "@/lib/services/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProductsPage() {
  const { branch } = useBranch();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  async function loadProducts() {
    if (!branch?.id) return;
    setLoading(true);
    try {
      const data = await getProductsByBranch(branch.id);
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, [branch?.id]);

  async function handleDelete(id: string) {
    await deleteProduct(id);
    await loadProducts();
  }

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  return (
    <main className="p-6 space-y-6 mx-auto h-dvh flex flex-col overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold">Productos</h1>
          <p className="text-sm text-muted-foreground">
            Administra productos de tu sucursal
          </p>
        </div>

        <Button onClick={() => router.push("/dashboard/services/productaction")}>
          Agregar producto
          <Plus />
        </Button>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
        <Input
          className="pl-10"
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-auto border rounded-xl">
        <div className="grid grid-cols-5 gap-4 px-4 py-3 text-sm font-medium border-b">
          <span>Nombre</span>
          <span>Descripción</span>
          <span>Precio</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {!loading && filtered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No hay productos.
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-5 gap-4 px-4 py-3 text-sm border-b items-center"
            >
              <span className="font-medium">{p.name}</span>
              <span className="truncate">{p.description ?? "-"}</span>
              <span>${(p.priceCents / 100).toFixed(2)}</span>
              <span>{p.isActive ? "Activo" : "Inactivo"}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    router.push(`/dashboard/services/productaction/edit/${p.id}`)
                  }
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void handleDelete(p.id)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
