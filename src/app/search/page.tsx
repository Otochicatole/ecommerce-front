"use client";
import ProductGrid from "@catalog/ui/product-grid";
import EmptySearchState from "@catalog/ui/empty-search-state";
import { useSearch } from "@/shared/search/search-context";

export default function SearchPage() {
  const { results, query } = useSearch();
  
  const hasSearched = query.length > 0;
  const hasResults = results.length > 0;
  
  return (
    <div className="flex flex-col min-h-[88vh] justify-between">
      {!hasSearched || hasResults ? (
        <ProductGrid products={results} />
      ) : (
        <EmptySearchState query={query} />
      )}
    </div>
  );
}