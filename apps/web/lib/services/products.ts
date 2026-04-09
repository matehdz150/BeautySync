import { api } from "./api";

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
  createdAt: string;
  updatedAt: string;
};

export type CreateProductInput = {
  branchId: string;
  name: string;
  priceCents: number;
  description?: string | null;
  imageUrl?: string | null;
};

export async function createProduct(input: CreateProductInput) {
  return api<Product>("/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getProductsByBranch(branchId: string) {
  return api<Product[]>(`/products/branch/${branchId}`, {
    method: "GET",
  });
}

export async function getProductById(id: string) {
  return api<Product>(`/products/${id}`, {
    method: "GET",
  });
}

export async function updateProduct(
  id: string,
  input: Partial<CreateProductInput>,
) {
  return api<Product>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteProduct(id: string) {
  return api<{ ok: true }>(`/products/${id}`, {
    method: "DELETE",
  });
}
