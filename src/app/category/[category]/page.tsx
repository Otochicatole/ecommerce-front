import { fetchProductFromCategory } from "@/lib/get-products";
import ProductGrid from "@/components/common/product-grid";
import { Product } from "@/types/api/product-response";

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const response = await fetchProductFromCategory(params.category);
  const products: Product[] = Array.isArray(response.data) ? response.data : [response.data];
  return <ProductGrid products={products} />;
}
