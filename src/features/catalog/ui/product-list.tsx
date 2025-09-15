'use client';
import CardProduct from "./card-product";
import CardProductSkeleton from "./card-product-skeleton";
import { Product } from "@/types/api/product-response";

interface ProductGridProps {
  products: Product[];
}

export default function ProductList({ products }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <ul className="flex flex-col gap-4 p-3">
        {Array.from({ length: 10 }).map((_, index) => (
          <CardProductSkeleton isList={true} key={index} />
        ))}
      </ul>
    );
  }

  return (
    <ul className="flex flex-col gap-4 p-3">
      {products.map((product) => (
        <CardProduct isList={true} key={product.id} data={product} />
      ))}
    </ul>
  );
}
