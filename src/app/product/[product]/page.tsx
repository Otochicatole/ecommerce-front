"use client";

import Box from "@/components/ui/box";
import { fetchProductById } from "@/lib/get-products";
import { Product } from "@/types/types";
import { useEffect, useState } from "react";
import Image from "next/image";
import VerticalCarousel from "./components/vertical-carrousel";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";

export default function Page({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const [data, setData] = useState<Product>({} as Product);
  const [productId, setProductId] = useState<string>("");
  const [imageViewUrl, setImageViewUrl] = useState<string>("");

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setProductId(resolvedParams.product);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (productId) {
      const fetchData = async () => {
        const data = await fetchProductById(productId);
        setData(data.data);
        const UrlDefaultImage = `${process.env.NEXT_PUBLIC_STRAPI_URL}${data.data.media?.[0]?.url}`;
        setImageViewUrl(UrlDefaultImage);
      };
      fetchData();
    }
  }, [productId]);

  return (
    <main className="flex flex-col items-center p-5 min-h-screen overflow-y-auto">
      <Box className="min-h-[95vh]">
        <div className="flex flex-row h-full min-h-[90vh] p-2 w-full gap-6">
          <article className="flex flex-col w-[70%]">
            <section className="flex gap-2 flex-row w-full">
              <VerticalCarousel data={data} setImageViewUrl={setImageViewUrl} />
              <div className="flex flex-row items-center justify-center w-full overflow-hidden h-[550px] p-6 bg-black/5 rounded-lg shadow-lg border border-black/1">
                {imageViewUrl ? (
                  <Image
                    className="object-cover rounded-lg"
                    src={imageViewUrl}
                    alt={data.name || "Imagen del producto"}
                    width={500}
                    height={500}
                    unoptimized
                  />
                ) : null}
              </div>
            </section>

            <section className="mt-6">
              <h2 className="text-xl text-black/70 font-semibold mb-2">
                Descripción
              </h2>
              {data?.description ? (
                <BlocksRenderer content={data.description} />
              ) : (
                <p>No description available.</p>
              )}
            </section>
          </article>

          <aside className="flex flex-col w-[30%] p-3 border border-black/10 rounded-lg">
            <header>
              <h1 className="text-xl font-semibold text-gray-900">
                {data.name}
              </h1>
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
