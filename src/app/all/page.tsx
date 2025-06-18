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
      {data.map((product) => (
        <CardProduct key={product.id} data={product} />
      ))}
    </>
  );
}
