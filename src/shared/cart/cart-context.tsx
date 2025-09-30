"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Product } from "@/types/api/product-response";

export interface CartItem {
  product: Product;
  size: string | null;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, size: string | null, qty?: number) => void;
  removeItem: (productId: number, size?: string | null) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  openCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "ecommerce-front:cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to parse cart from localStorage", err);
    }
  }, []);

  // Persist cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error("Failed to write cart to localStorage", err);
    }
  }, [items]);

  const addItem = (product: Product, size: string | null, qty: number = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((it) => it.product.id === product.id && it.size === size);
      if (existingIndex !== -1) {
        return prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prev, { product, size, quantity: qty }];
    });
  };

  const removeItem = (productId: number, size: string | null = null) => {
    setItems((prev) => prev.filter((it) => !(it.product.id === productId && it.size === size)));
  };

  const clearCart = () => setItems([]);

  const toggleCart = () => setIsOpen((v) => !v);
  const openCart = () => setIsOpen(true);

  const totalItems = useMemo(() => items.reduce((acc, it) => acc + it.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((acc, it) => acc + (it.product.offer ? it.product.offerPrice : it.product.price) * it.quantity, 0), [items]);

  const value: CartContextValue & { totalPrice: number } = {
    items,
    addItem,
    removeItem,
    clearCart,
    totalItems,
    totalPrice,
    isOpen,
    openCart,
    toggleCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

