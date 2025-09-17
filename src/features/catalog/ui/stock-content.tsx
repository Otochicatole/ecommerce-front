'use client';

import ProductList from "@catalog/ui/product-list";
import Pagination from "@catalog/ui/pagination";
import { Product } from "@/types/api/product-response";
import { useState } from "react";

interface StockContentProps {
  products: Product[];
  currentPage: number;
  pageCount: number;
}

export default function StockContent({ products, currentPage, pageCount }: StockContentProps) {
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const showPagination = !isSearchActive && pageCount > 1;

  return (
    <div className="flex flex-col min-h-[88vh]">
      <ProductList products={products} onSearchActiveChange={setIsSearchActive} />
      {showPagination && (
        <Pagination currentPage={currentPage} pageCount={pageCount} basePath="/admin/stock" />
      )}
    </div>
  );
}


