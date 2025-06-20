"use client";

import CardProduct from "@/components/common/card-product";
import CardProductSkeleton from "@/components/common/card-product-skeleton";
import { fetchAllProducts } from "@/lib/get-products";
import { useEffect, useState } from "react";
import { Product } from "@/types/types";

export default function Page() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const data = await fetchAllProducts();
      setData(data.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-3">
        {loading
          ? Array.from({ length: 10 }).map((_, index) => (
            <CardProductSkeleton key={index} />
          ))
          : data.map((product) => (
            <CardProduct key={product.id} data={product} />
          ))}
      </ul>
    </>
  );
}
