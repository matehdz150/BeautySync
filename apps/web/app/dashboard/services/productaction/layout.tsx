"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductDraftProvider, useProductDraft } from "@/context/ProductDraftContext";
import { createProduct, updateProduct } from "@/lib/services/products";

export default function ProductActionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProductDraftProvider>
      <div className="min-h-screen">
        <div className="mx-auto px-8 py-8">
          <header className="sticky top-0 z-40 bg-white py-6">
            <div className="flex items-center justify-between">
              <Title />
              <HeaderActions />
            </div>
          </header>

          <main className="max-w-4xl">{children}</main>
        </div>
      </div>
    </ProductDraftProvider>
  );
}

function HeaderActions() {
  const router = useRouter();
  const { state, dispatch, isValid, validateAndFocus } = useProductDraft();

  async function handleSave() {
    const ok = validateAndFocus();
    if (!ok || !state.branchId || state.priceCents == null) return;

    if (state.id) {
      await updateProduct(state.id, {
        branchId: state.branchId,
        name: state.name,
        description: state.description ?? "",
        priceCents: state.priceCents,
        imageUrl: state.imageUrl ?? "",
      });
    } else {
      await createProduct({
        branchId: state.branchId,
        name: state.name,
        description: state.description ?? "",
        priceCents: state.priceCents,
        imageUrl: state.imageUrl ?? "",
      });
    }

    dispatch({ type: "RESET" });
    router.push("/dashboard/services/overview/products");
  }

  function handleCancel() {
    dispatch({ type: "RESET" });
    router.push("/dashboard/services/overview/products");
  }

  return (
    <div className="flex gap-3">
      <Button variant="outline" className="bg-white shadow-none" onClick={handleCancel}>
        Cerrar
      </Button>
      <Button
        className={cn(!isValid && "opacity-50 cursor-not-allowed")}
        onClick={() => void handleSave()}
      >
        Guardar
      </Button>
    </div>
  );
}

function Title() {
  const { state } = useProductDraft();
  return (
    <h1 className="text-3xl font-bold">
      {state.id ? "Editar producto" : "Nuevo producto"}
    </h1>
  );
}
