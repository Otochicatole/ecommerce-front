'use client';
import Box from "@/shared/ui/box";
import VerticalCarousel from "./vertical-carousel";
import { Product } from "@/types/api/product-response";
import Image from "next/image";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import { useMemo, useState } from "react";
import { useCart } from "@/shared/cart/cart-context";
import { toast } from "react-hot-toast";
import { getPublicImageUrl } from "@/shared/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const images = useMemo(() => (product.media ?? []).map(m => getPublicImageUrl(m?.url)), [product.media]);
  const initialImage = images[0] ?? "/nullimg.webp";
  const [imageViewUrl, setImageViewUrl] = useState(initialImage);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes?.[0]?.size ?? null);
  const { addItem } = useCart();

  return (
    <main className="flex flex-col items-center p-4 sm:p-5 min-h-screen overflow-y-auto">
      <Box className="min-h-[60vh]">
        <div className="flex flex-col lg:grid lg:grid-cols-12 h-full min-h-[50vh] p-2 w-full gap-4 lg:gap-6">
          {/* gallery first always */}
          <article className="flex flex-col w-full order-1 lg:col-span-8">
            <section className="flex gap-2 flex-col md:flex-row w-full">
              <VerticalCarousel data={product} setImageViewUrl={(url) => {
                setImageViewUrl(url);
                const idx = images.findIndex(u => u === url);
                if (idx >= 0) setActiveIdx(idx);
              }} />
              <div className="relative group w-full">
                <div className="flex items-center justify-center w-full overflow-hidden h-[50vh] md:h-[60vh] lg:h-[550px] p-4 md:p-6 bg-black/5 rounded-lg shadow-lg border border-black/1">
                  {images[activeIdx] ? (
                    <Image className="object-contain w-full h-full rounded-lg max-h-full max-w-full" src={imageViewUrl} loading="lazy" alt={product.name || "Imagen del producto"} width={800} height={800} unoptimized />
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="anterior"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-12 md:h-10 md:w-10 grid place-items-center rounded-md bg-black/20 backdrop-blur-sm text-white shadow hover:bg-black/20 active:scale-95 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    const next = (activeIdx - 1 + images.length) % Math.max(1, images.length);
                    setActiveIdx(next);
                    setImageViewUrl(images[next] ?? initialImage);
                    (e.currentTarget as HTMLButtonElement).blur();
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  aria-label="siguiente"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-12 md:h-10 md:w-10 grid place-items-center rounded-md bg-black/20 backdrop-blur-sm text-white shadow hover:bg-black/20 active:scale-95 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    const next = (activeIdx + 1) % Math.max(1, images.length);
                    setActiveIdx(next);
                    setImageViewUrl(images[next] ?? initialImage);
                    (e.currentTarget as HTMLButtonElement).blur();
                  }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </section>
            
          </article>
          <aside className="flex flex-col w-full p-4 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl transition-all duration-300 order-2 lg:col-span-4">
            {/* Product Title */}
            <header>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{product.name}</h1>
            </header>

            {/* Pricing */}
            <section className="mt-4 flex items-baseline gap-3">
              {product.offer ? (
                <>
                  <span className="text-2xl font-bold text-rose-600">{`$${product.offerPrice.toLocaleString('en-US')}`}</span>
                  <span className="text-sm line-through text-gray-400">{`$${product.price.toLocaleString('en-US')}`}</span>
                </>
              ) : (
                <span className="text-2xl font-bold text-gray-900">{`$${product.price.toLocaleString('en-US')}`}</span>
              )}
            </section>

            {/* Size selector */}
            {product.sizes?.length ? (
              <section className="mt-6">
                <h2 className="text-sm font-medium text-gray-700">Talle</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedSize(size.size)}
                      className={`px-4 py-2 rounded-full border transition-all duration-150 active:scale-95 ${selectedSize === size.size ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-300'}`}
                    >
                      {size.size}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Stock */}
            <section className="mt-6">
              {product.stock ? (
                <p className="text-sm text-gray-600">Stock disponible: <span className="font-medium text-gray-900">{product.stock}</span></p>
              ) : (
                <p className="text-sm text-rose-600">Sin stock</p>
              )}
            </section>

            {/* Add to cart button */}
            <button
              type="button"
              disabled={!product.stock || product.stock === 0}
              className="mt-8 md:mt-10 cursor-pointer w-full bg-blue-600 text-white font-medium py-3 md:py-3.5 rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
              onClick={() => {
                addItem(product, selectedSize ?? null);
                toast.success('Agregado al carrito correctamente');
              }}
            >
              Agregar al carrito
            </button>
          </aside>
          {/* Description moved to the end */}
          <section className="mt-6 order-3 w-full lg:col-span-12">
            <h2 className="text-xl text-black/70 font-semibold mb-2">Descripción</h2>
            {product?.description ? <BlocksRenderer content={product.description} /> : <p>No description available.</p>}
          </section>
        </div>
      </Box>
    </main>
  );
}
