import { fetchProducts } from "@catalog/services/products";
import Pagination from "@catalog/ui/pagination";
import { DEFAULT_PAGE_SIZE } from "@/config";
import ProductList from "@catalog/ui/product-list";

interface AllPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StockPage({ searchParams }: AllPageProps) {
  const { page } = await searchParams;
  const pageStr = Array.isArray(page) ? page[0] : page;
  const currentPage = parseInt(pageStr ?? '1', 10);
  const pageSize = DEFAULT_PAGE_SIZE;
  const response = await fetchProducts({ page: currentPage, pageSize });
  const { data: products, meta } = response;
  const pageCount = meta.pagination.pageCount;

  return (
    <div className="flex flex-col min-h-[88vh] justify-between">
      <ProductList products={products} />
      <Pagination currentPage={currentPage} pageCount={pageCount} basePath="/admin/stock" />
    </div>
  );
}
