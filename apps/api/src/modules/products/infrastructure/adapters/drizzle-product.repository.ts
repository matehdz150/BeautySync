// src/modules/products/infrastructure/repositories/drizzle-product.repository.ts

import { Inject, Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import * as client from 'src/modules/db/client';
import { products } from 'src/modules/db/schema';

import { ProductRepository } from '../../core/ports/product.port';
import { Product } from '../../core/entities/product.entity';

@Injectable()
export class DrizzleProductRepository implements ProductRepository {
  constructor(@Inject('DB') private db: client.DB) {}

  // =========================
  // 🔥 CREATE
  // =========================
  async create(data: {
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
  }): Promise<Product> {
    const [row] = await this.db
      .insert(products)
      .values({
        branchId: data.branchId,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        priceCents: data.priceCents,
        costCents: data.costCents ?? null,
        sku: data.sku ?? null,
        imageUrl: data.imageUrl ?? null,
      })
      .returning();

    return this.mapToEntity(row);
  }

  // =========================
  // 🔥 FIND BY ID
  // =========================
  async findById(id: string): Promise<Product | null> {
    const row = await this.db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!row) return null;

    return this.mapToEntity(row);
  }

  // =========================
  // 🔥 FIND BY BRANCH
  // =========================
  async findByBranch(branchId: string): Promise<Product[]> {
    const rows = await this.db.query.products.findMany({
      where: and(
        eq(products.branchId, branchId),
        eq(products.isActive, true), // 🔥 importante
      ),
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    });

    return rows.map((r) => this.mapToEntity(r));
  }

  // =========================
  // 🔥 UPDATE
  // =========================
  async update(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string | null;
      priceCents: number;
      costCents: number | null;
      stock: number;
      lowStockThreshold: number;
      sku: string | null;
      imageUrl: string | null;
      isActive: boolean;
    }>,
  ): Promise<Product> {
    const [row] = await this.db
      .update(products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return this.mapToEntity(row);
  }

  // =========================
  // 🔥 DELETE (hard)
  // =========================
  // (realmente no lo usamos, pero lo dejamos por contrato)
  async delete(id: string): Promise<{ id: string; branchId: string }> {
    const row = await this.db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!row) {
      throw new Error('Product not found');
    }

    await this.db.delete(products).where(eq(products.id, id));

    return {
      id: row.id,
      branchId: row.branchId,
    };
  }

  // =========================
  // 🔥 MAPPER
  // =========================
  private mapToEntity(row: typeof products.$inferSelect): Product {
    return {
      id: row.id,
      branchId: row.branchId,

      name: row.name,
      slug: row.slug,

      description: row.description,

      priceCents: row.priceCents,
      costCents: row.costCents,

      sku: row.sku,

      imageUrl: row.imageUrl,

      isActive: row.isActive,

      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
