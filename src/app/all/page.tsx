"use client";

import CardProduct from "@/components/common/card-product";
import { fetchProducts } from "@/lib/get-products";
import { useEffect, useState } from "react";
import { Product } from "@/types/types";

export default function Page() {
  const [data, setData] = useState<Product[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchProducts();
      setData(data.data);
    };
    fetchData();
  }, []);

  return (
    <>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-3">
        {data.map((product) => (
          <CardProduct key={product.id} data={product} />
        ))}
      </ul>
    </>
  );
}
