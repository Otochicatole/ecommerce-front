'use client';
import CardProduct from "./card-product";
import CardProductSkeleton from "./card-product-skeleton";
import { Product } from "@/types/api/product-response";
import SearchBar from "./search-bar";
import Link from "next/link";
import { fetchProductsBySearch } from "@ecommerce-front/features/catalog/services/product/get";
import { useEffect, useState } from "react";

interface ProductGridProps {
  products: Product[];
  onSearchActiveChange?: (active: boolean) => void;
}

export default function ProductList({ products, onSearchActiveChange }: ProductGridProps) {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Product[] | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    (async () => {
      try {
        const response = await fetchProductsBySearch(trimmed);
        if (!cancelled) setResults(response.data as Product[]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    const isActive = query.trim().length > 0;
    onSearchActiveChange?.(isActive);
  }, [query, onSearchActiveChange]);

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
  <>
      <div className="flex items-center justify-between px-3">
        <SearchBar value={query} onChange={setQuery} />
        <Link href="/admin/create" className="ml-3 inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-xs text-white hover:bg-gray-800">
          crear producto
        </Link>
      </div>
        {isSearching ? (
          <ul className="flex flex-col gap-4 p-3">
            {Array.from({ length: 10 }).map((_, index) => (
              <CardProductSkeleton isList={true} key={index} />
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-4 p-3">
            {(results ?? products).map((product) => (
              <CardProduct isList={true} key={product.id} data={product} />
            ))}
          </ul>
        )}
    </>
  );
}
