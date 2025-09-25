import { fetchProducts } from "@ecommerce-front/features/catalog/services/product/get";
import ProductGrid from "@catalog/ui/product-grid";
import Pagination from "@catalog/ui/pagination";
import { DEFAULT_PAGE_SIZE } from "@/config";

interface OffersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OffersPage({ searchParams }: OffersPageProps) {
  const { page } = await searchParams;
  const pageStr = Array.isArray(page) ? page[0] : page;
  const currentPage = parseInt(pageStr ?? '1', 10);
  const pageSize = DEFAULT_PAGE_SIZE;
  const response = await fetchProducts({ page: currentPage, pageSize, offer: true });
  const { data: products, meta } = response;
  const pageCount = meta.pagination.pageCount;

  return (
    <div className="flex flex-col min-h-[88vh] justify-between">
      <ProductGrid products={products} />
      <Pagination currentPage={currentPage} pageCount={pageCount} basePath="/offers" />
    </div>
  );
}
