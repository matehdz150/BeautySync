// src/modules/products/core/ports/product.repository.ts

import { Product } from '../entities/product.entity';

export interface ProductRepository {
  create(data: {
    branchId: string;
    name: string;
    slug: string;
    description?: string | null;
    priceCents: number;
    costCents?: number | null;
    stock?: number;
    lowStockThreshold?: number;
    sku?: string | null;
    imageUrl?: string | null;
  }): Promise<Product>;

  findById(id: string): Promise<Product | null>;

  findByBranch(branchId: string): Promise<Product[]>;

  update(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string | null;
      priceCents: number;
      costCents: number | null;
      sku: string | null;
      imageUrl: string | null;
      isActive: boolean;
    }>,
  ): Promise<Product>;

  delete(id: string): Promise<{ id: string; branchId: string }>;
}
