"use client";
import { useCart } from "./cart-context";
import Image from "next/image";
import { Trash2, X } from "lucide-react";
import env from "@/config";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function CartAside() {
  const router = useRouter();
  const { items, isOpen, toggleCart, totalItems, totalPrice, removeItem } = useCart();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={toggleCart}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Tu carrito ({totalItems})</h2>
              <button onClick={toggleCart} aria-label="Cerrar carrito" className="p-2 rounded-md hover:bg-gray-100">
                <X size={20} />
              </button>
            </header>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4"
              style={{ direction: 'rtl' }}
            >
              {items.length === 0 ? (
                <p className="text-center text-gray-500">Aún no agregaste productos.</p>
              ) : (
                items.map(({ product, size, quantity }) => {
                  const imageUrl = product.media?.[0]?.url ? `${env.strapiUrl}${product.media[0].formats?.thumbnail?.url ?? product.media[0].url}` : "/nullimg.webp";
                  return (
                    <div
                      key={`${product.id}-${size ?? 'na'}`}
                      style={{ direction: 'ltr' }}
                      className="flex items-center gap-4 shadow-sm rounded-md p-2 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        toggleCart();
                        router.push(`/product/${product.documentId}`);
                      }}
                    >
                      <Image src={imageUrl} alt={product.name} width={64} height={64} className="rounded-md object-cover" unoptimized />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</h3>
                        {size && <p className="text-xs text-gray-500">Talle: {size}</p>}
                        <p className="text-sm font-semibold text-gray-800 mt-1">${product.offer ? product.offerPrice : product.price} x {quantity}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          removeItem(product.id, size);
                          e.stopPropagation();
                        }}
                        className="text-xs cursor-pointer transition-all duration-300 hover:text-rose-600 hover:bg-black/5 rounded-md p-3">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <footer className="p-6 border-t border-gray-200 space-y-4">
                <div className="flex justify-between text-base font-medium">
                  <span>Total</span>
                  <span>${totalPrice.toLocaleString('en-US')}</span>
                </div>
                <button className="w-full cursor-pointer bg-blue-600 text-white font-medium py-3 rounded-lg shadow hover:bg-blue-700 active:scale-95 transition-transform" onClick={() => {
                  toggleCart();
                  window.location.href = '/checkout';
                }}>
                  Comprar
                </button>
              </footer>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

