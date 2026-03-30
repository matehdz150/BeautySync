// src/modules/products/core/helpers/product-slug.ts

export function buildProductSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}
