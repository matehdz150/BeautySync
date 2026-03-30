// src/modules/products/core/entities/product.entity.ts

export type Product = {
  id: string;

  branchId: string;

  name: string;
  slug: string;

  description?: string | null;

  priceCents: number;
  costCents?: number | null;

  sku?: string | null;

  imageUrl?: string | null;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
};
