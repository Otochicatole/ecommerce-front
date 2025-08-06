import { fetchProducts } from "@catalog/services/products";
import ProductGrid from "@catalog/ui/product-grid";
import Pagination from "@catalog/ui/pagination";
import { DEFAULT_PAGE_SIZE } from "@/config";
import { Product } from "@/types/api/product-response";

interface CategoryPageProps {
  params: { category: string };
  searchParams: { page?: string };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const currentPage = parseInt(searchParams.page ?? '1', 10);
  const pageSize = DEFAULT_PAGE_SIZE;
  const category = decodeURIComponent(params.category);
  const response = await fetchProducts({ page: currentPage, pageSize, category });
  const products: Product[] = Array.isArray(response.data) ? response.data : [response.data];
  const pageCount = response.meta.pagination.pageCount;

  return (
    <div className="flex flex-col min-h-[88vh] justify-between">
      <ProductGrid products={products} />
      <Pagination currentPage={currentPage} pageCount={pageCount} basePath={`/category/${params.category}`} />
    </div>
  );
}
