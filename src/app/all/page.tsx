import { fetchAllProducts } from "@/lib/get-products";
import ProductGrid from "@/components/common/product-grid";

export default async function AllProductsPage() {
  const response = await fetchAllProducts();
  const products = response.data;
  return <ProductGrid products={products} />;
}
