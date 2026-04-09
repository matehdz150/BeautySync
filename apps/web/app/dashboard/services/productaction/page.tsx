"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProductDraft } from "@/context/ProductDraftContext";

export default function ProductBasicInfoPage() {
  const { state, dispatch } = useProductDraft();

  const priceDisplay =
    typeof state.priceCents === "number" && !Number.isNaN(state.priceCents)
      ? state.priceCents / 100
      : "";

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-2xl p-4 border">
        <h2 className="text-2xl font-semibold mb-6">Detalles del producto</h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="font-medium text-gray-800">Nombre del producto</Label>
            <Input
              id="product-name"
              className="h-12"
              placeholder="Ej. Shampoo nutritivo"
              value={state.name}
              onChange={(e) =>
                dispatch({ type: "SET_NAME", value: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-gray-800">
              Descripción (opcional)
            </Label>
            <Textarea
              rows={5}
              className="resize-none"
              placeholder="Describe el producto"
              value={state.description ?? ""}
              onChange={(e) =>
                dispatch({ type: "SET_DESCRIPTION", value: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-gray-800">URL de imagen</Label>
            <Input
              className="h-12"
              placeholder="https://..."
              value={state.imageUrl ?? ""}
              onChange={(e) =>
                dispatch({ type: "SET_IMAGE_URL", value: e.target.value })
              }
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-4 border">
        <h2 className="text-lg font-semibold mb-4">Precio</h2>

        <div className="space-y-2 max-w-sm">
          <Label className="font-medium text-gray-800">Precio en MXN</Label>
          <div className="flex items-center gap-2 px-4 h-12 rounded-lg border">
            <span className="text-sm text-muted-foreground">MXN</span>
            <Input
              id="product-price"
              className="h-full shadow-none border-none px-0"
              placeholder="0.00"
              value={priceDisplay}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  dispatch({ type: "SET_PRICE", value: null });
                  return;
                }

                dispatch({
                  type: "SET_PRICE",
                  value: Math.round(Number(raw) * 100),
                });
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
