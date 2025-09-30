import type { Product } from "@/types/api/product-response";

export type PosCartItem = {
  product: Product;
  quantity: number;
};

export type PosCart = PosCartItem[];

export function addToCart(cart: PosCart, product: Product, quantity: number = 1): PosCart {
  const idx = cart.findIndex((it) => it.product.id === product.id);
  if (idx === -1) return [...cart, { product, quantity }];
  const updated = [...cart];
  updated[idx] = { product, quantity: updated[idx].quantity + quantity };
  return updated;
}

export function setItemQuantity(cart: PosCart, productId: number, quantity: number): PosCart {
  if (quantity <= 0) return cart.filter((it) => it.product.id !== productId);
  return cart.map((it) => (it.product.id === productId ? { ...it, quantity } : it));
}

export function removeFromCart(cart: PosCart, productId: number): PosCart {
  return cart.filter((it) => it.product.id !== productId);
}

export function clearCart(): PosCart {
  return [];
}

export function calculateSubtotal(item: PosCartItem): number {
  const price = item.product.offer ? item.product.offerPrice : item.product.price;
  return price * item.quantity;
}

export function calculateTotal(cart: PosCart): number {
  return cart.reduce((acc, it) => acc + calculateSubtotal(it), 0);
}

export function hasSufficientStock(cart: PosCart): boolean {
  return cart.every((it) => typeof it.product.stock === 'number' && it.product.stock >= it.quantity);
}


