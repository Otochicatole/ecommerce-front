import { Product } from "@/types/types";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import Button from "../ui/button";

export default function CardProduct({ data }: { data: Product }) {
  return (
    <article className="relative grid grid-rows-[auto_1fr] rounded-xl overflow-hidden max-w-sm shadow-lg">
      {data.offer && <span>Oferta Exclusiva</span>}
      <figure>
        <Image
          className="w-full h-60 object-cover object-top"
          src={`${process.env.NEXT_PUBLIC_STRAPI_URL}${data.media[0].url}`}
          alt={data.media[0].alternativeText || "Producto"}
          width={400}
          height={400}
          unoptimized
        />
      </figure>
      <section className="grid grid-rows-[auto_auto_1fr_auto] gap-2 p-4">
        <div className="grid grid-rows-[auto_auto] gap-1 mb-10 border">
          <h1>{data.name}</h1>
          <p>{data.description}</p>
        </div>
        <footer className="absolute bottom-0 left-0 flex flex-col w-full border">
          <div className="flex flex-row justify-between">
            <div>
              {data.offer ? (
                <>
                  <span>${data.price}</span>
                  <span>${data.offerPrice}</span>
                </>
              ) : (
                <span>${data.price}</span>
              )}
            </div>
            <Button>
              <span>Add to Cart</span>
              <ShoppingBag size={20} />
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div />
            <span className="text-green-600">In Stock</span>
          </div>
        </footer>
      </section>
    </article>
  );
}
