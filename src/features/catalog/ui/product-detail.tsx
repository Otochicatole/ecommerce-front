'use client';
import Box from "@/shared/ui/box";
import VerticalCarousel from "./vertical-carousel";
import { Product } from "@/types/api/product-response";
import Image from "next/image";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import { useState } from "react";
import { useCart } from "@/shared/cart/cart-context";
import { toast } from "react-hot-toast";
import env from "@/config";

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const initialImage = product.media?.[0]?.url ? `${env.strapiUrl}${product.media[0].url}` : "/nullimg.webp";
  const [imageViewUrl, setImageViewUrl] = useState(initialImage);
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes?.[0]?.size ?? null);
  const { addItem } = useCart();


  return (
    <main className="flex flex-col items-center p-5 min-h-screen overflow-y-auto">
      <Box className="min-h-[95vh]">
        <div className="flex flex-row h-full min-h-[90vh] p-2 w-full gap-6">
          <article className="flex flex-col w-[70%]">
            <section className="flex gap-2 flex-row w-full">
              <VerticalCarousel data={product} setImageViewUrl={setImageViewUrl} />
              <div className="flex flex-row items-center justify-center w-full overflow-hidden h-[550px] p-6 bg-black/5 rounded-lg shadow-lg border border-black/1">
                {imageViewUrl ? (
                  <Image className="object-cover w-fit h-fit rounded-lg" src={imageViewUrl} loading="lazy" alt={product.name || "Imagen del producto"} width={500} height={500} unoptimized />
                ) : null}
              </div>
            </section>
            <section className="mt-6">
              <h2 className="text-xl text-black/70 font-semibold mb-2">Descripción</h2>
              {product?.description ? <BlocksRenderer content={product.description} /> : <p>No description available.</p>}
            </section>
          </article>
          <aside className="flex flex-col w-[30%] p-4 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl transition-all duration-300">
            {/* Product Title */}
            <header>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{product.name}</h1>
            </header>

            {/* Pricing */}
            <section className="mt-4 flex items-baseline  gap-3">
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
              <section className="mt-6 ">
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
            <section className="mt-6 ">
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
              className="mt-10 cursor-pointer w-full bg-blue-600 text-white font-medium py-3 rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
              onClick={() => {
                addItem(product, selectedSize ?? null);
                toast.success('Agregado al carrito correctamente');
              }}
            >
              Agregar al carrito
            </button>
          </aside>
        </div>
      </Box>
    </main>
  );
}
