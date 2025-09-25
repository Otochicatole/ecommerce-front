"use client";
import ProductGrid from "@catalog/ui/product-grid";
import { useSearch } from "@/shared/search/search-context";

export default function SearchPage() {
  const { results } = useSearch();
  return (
    <div className="flex flex-col min-h-[88vh] justify-between">
      <ProductGrid products={results} />
    </div>
  );
}