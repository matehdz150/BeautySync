"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useProductDraft } from "@/context/ProductDraftContext";
import { getProductById } from "@/lib/services/products";
import ProductBasicInfoPage from "../../page";

export default function EditProductPage() {
  const params = useParams();
  const { dispatch } = useProductDraft();

  useEffect(() => {
    if (!params?.id) return;

    async function load() {
      const product = await getProductById(params.id as string);

      dispatch({
        type: "LOAD_EXISTING",
        value: {
          id: product.id,
          branchId: product.branchId,
          name: product.name,
          description: product.description ?? "",
          priceCents: product.priceCents,
          imageUrl: product.imageUrl ?? "",
          isActive: product.isActive,
        },
      });
    }

    void load();
  }, [params?.id, dispatch]);

  return <ProductBasicInfoPage />;
}
