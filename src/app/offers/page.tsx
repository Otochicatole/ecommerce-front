import { fetchAllProductsOffer } from "@/lib/get-products";
import ProductGrid from "@/components/common/product-grid";

export default async function OffersPage() {
  const response = await fetchAllProductsOffer();
  const products = response.data;
  return <ProductGrid products={products} />;
}
