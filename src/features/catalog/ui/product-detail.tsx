'use client';
import Box from "@/shared/ui/box";
import VerticalCarousel from "./vertical-carousel";
import { Product } from "@/types/api/product-response";
import Image from "next/image";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import { useState } from "react";
import env from "@/config";

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const initialImage = product.media?.[0]?.url ? `${env.strapiUrl}${product.media[0].url}` : "/nullimg.webp";
  const [imageViewUrl, setImageViewUrl] = useState(initialImage);

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
          <aside className="flex flex-col w-[30%] p-3 border border-black/10 rounded-lg">
            <header>
              <h1 className="text-xl font-semibold text-gray-900">{product.name}</h1>
            </header>
            <section className="mt-4">
              <p className="text-gray-700 whitespace-pre-line">asd</p>
            </section>
          </aside>
        </div>
      </Box>
    </main>
  );
}
