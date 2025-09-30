"use server";

import type { PosCart } from "@/sales/domain/cart";
import { hasSufficientStock } from "@/sales/domain/cart";
import { updateProduct } from "@/features/catalog/services/product/mutate";
import { createSaleRecord } from "@/sales/infra/sales.http";

// Registers a POS sale: validates stock and updates each product stock.
// Only side-effect: decrement product stock by quantity sold.
export async function registerSale(cart: PosCart): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Array.isArray(cart) || cart.length === 0) return { ok: false, error: 'empty-cart' };
  if (!hasSufficientStock(cart)) return { ok: false, error: 'insufficient-stock' };

  // Process sequentially to keep things simple; could batch in future
  for (const item of cart) {
    const remaining = Math.max(0, (item.product.stock ?? 0) - item.quantity);
    const fd = new FormData();
    // use documentId when present, fallback to numeric id
    fd.set('id', item.product.documentId ?? String(item.product.id));
    fd.set('stock', String(remaining));
    try {
      await updateProduct(fd);
      try {
        await createSaleRecord({
          name: item.product.name,
          salePrice: (item.product.offer ? item.product.offerPrice : item.product.price) * item.quantity,
          saleDate: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
        });
      } catch {}
    } catch (e) {
      const message = e instanceof Error ? e.message : 'update-failed';
      return { ok: false, error: message };
    }
  }
  return { ok: true };
}


