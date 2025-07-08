"use client";

import CardProduct from "@/components/common/card-product";
import CardProductSkeleton from "@/components/common/card-product-skeleton";
import { fetchProductFromCategory } from "@/lib/get-products";
import { useEffect, useState } from "react";
import { Product } from "@/types/api/product-response";

export default function AllProductsPage({ params }: { params: { category: string }; }) {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameCategory, setNameCategory] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { category } = await params;
        setNameCategory(category);
        setError(null);
        const response = await fetchProductFromCategory(category);
        const products = Array.isArray(response.data) ? response.data : [response.data];
        setData(products);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("An error occurred while fetching the products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [nameCategory, params]);

  if (error) {
    return <p className="text-center text-red-500 p-4">{error}</p>;
  }

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