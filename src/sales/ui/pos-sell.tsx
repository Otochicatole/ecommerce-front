'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@/types/api/product-response';
import { addToCart, calculateSubtotal, calculateTotal, clearCart, PosCart, removeFromCart, setItemQuantity } from '@/sales/domain/cart';
import { fetchAllProducts, fetchProductsBySearch } from '@ecommerce-front/features/catalog/services/product/get';
import { registerSale } from '@/sales/application/register-sale';
import { Plus, Minus, Search, X } from 'lucide-react';

type PosSellProps = {
  initialProducts?: Product[];
};

export function PosSell({ initialProducts = [] }: PosSellProps) {
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<PosCart>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // small util to clamp quantities
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

  useEffect(() => {
    if (initialProducts.length) return;
    (async () => {
      try {
        const res = await fetchAllProducts();
        const items = Array.isArray(res?.data) ? res.data : [];
        setAllProducts(items);
        setResults(items);
      } catch {}
    })();
  }, [initialProducts.length]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(allProducts);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchProductsBySearch(trimmed);
        if (!cancelled) setResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) setResults([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query, allProducts]);

  const total = useMemo(() => calculateTotal(cart), [cart]);

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-2 gap-6">
      <section className="bg-white/80 backdrop-blur-xl shadow-lg ring-1 ring-black/5 rounded-3xl p-5">
        <div className="mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar producto"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full bg-gray-100/80 focus:bg-white px-10 py-2 text-sm outline-none ring-1 ring-transparent focus:ring-gray-300 transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-gray-200 hover:bg-gray-300 active:scale-95 transition"
                aria-label="clear"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <ul className="max-h-[60vh] overflow-auto divide-y p-3 divide-gray-100">
          {results.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-[15px] font-semibold text-gray-900">{p.name}</p>
                <p className="text-[12px] text-gray-600">${(p.offer ? p.offerPrice : p.price).toLocaleString('es-AR')} • stock: {p.stock}</p>
              </div>
              <button
                type="button"
                disabled={!p.stock || p.stock <= 0}
                onClick={() => setCart((c) => addToCart(c, p, 1))}
                className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-gray-900 text-white shadow-md hover:scale-105 active:scale-95 transition disabled:opacity-40"
                aria-label="agregar"
              >
                <Plus size={16} />
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="py-6 text-sm text-gray-500 text-center">sin resultados</li>
          )}
        </ul>
      </section>

      <section className="bg-white/80 backdrop-blur-xl shadow-lg ring-1 ring-black/5 rounded-3xl p-5 flex flex-col">
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Carrito</h2>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setCart(clearCart())}
              className="text-[12px] px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition"
            >
              Vaciar
            </button>
          )}
        </header>
        {cart.length === 0 ? (
          <p className="text-sm text-gray-500">No hay productos</p>
        ) : (
          <>
            <ul className="divide-y divide-gray-100 p-3">
              {cart.map((it) => (
                <li key={it.product.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-gray-900">{it.product.name}</p>
                    <p className="text-[12px] text-gray-600">${(it.product.offer ? it.product.offerPrice : it.product.price).toLocaleString('es-AR')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCart((c) => setItemQuantity(c, it.product.id, clamp(it.quantity - 1, 1, it.product.stock)))}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition"
                      aria-label="decrement"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={it.product.stock}
                      value={it.quantity}
                      onChange={(e) => {
                        const q = clamp(Number(e.target.value || 1), 1, it.product.stock);
                        setCart((c) => setItemQuantity(c, it.product.id, q));
                      }}
                      className="w-16 text-center border rounded-full px-3 py-1 text-sm bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => setCart((c) => setItemQuantity(c, it.product.id, clamp(it.quantity + 1, 1, it.product.stock)))}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition"
                      aria-label="increment"
                    >
                      <Plus size={14} />
                    </button>
                    <span className="text-sm font-semibold min-w-[96px] text-right">${calculateSubtotal(it).toLocaleString('es-AR')}</span>
                    <button
                      type="button"
                      onClick={() => setCart((c) => removeFromCart(c, it.product.id))}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition"
                      aria-label="quitar"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-white/80 backdrop-blur-xl rounded-b-3xl">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-gray-900">Total</span>
                <span className="text-base font-semibold text-gray-900">${total.toLocaleString('es-AR')}</span>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={loading || cart.length === 0}
                  onClick={async () => {
                    setError(null);
                    setLoading(true);
                    const res = await registerSale(cart);
                    setLoading(false);
                    if (!res.ok) {
                      setError(res.error || 'unknown-error');
                      return;
                    }
                    setCart(clearCart());
                  }}
                  className="px-6 py-3 rounded-full bg-blue-600 text-white text-sm font-semibold shadow-md hover:bg-blue-700 active:scale-95 transition disabled:opacity-40"
                >
                  {loading ? 'procesando...' : 'Vender'}
                </button>
              </div>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
          </>
        )}
      </section>
    </div>
  );
}


