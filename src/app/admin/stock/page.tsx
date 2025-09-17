import { fetchProducts } from "@catalog/services/products";
import { DEFAULT_PAGE_SIZE } from "@/config";
import StockContent from "@catalog/ui/stock-content";

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
    <StockContent products={products} currentPage={currentPage} pageCount={pageCount} />
  );
}
