// Utilities to map API Product shape to domain-friendly types
// - Convert numeric string fields to numbers
// - Keep the rest of the structure intact

import type { Product } from "@/types/api/product-response";

function toNumberSafe(value: unknown, fallback: number = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function mapProductNumericFields(input: Product): Product {
  return {
    ...input,
    price: toNumberSafe((input as unknown as { price?: unknown }).price, 0),
    offerPrice: toNumberSafe((input as unknown as { offerPrice?: unknown }).offerPrice, 0),
    stock: toNumberSafe((input as unknown as { stock?: unknown }).stock, 0),
  } as Product;
}

export function mapProductsNumericFields(items: Product[]): Product[] {
  return items.map(mapProductNumericFields);
}


