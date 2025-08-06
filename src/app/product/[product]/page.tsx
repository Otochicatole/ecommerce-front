import { fetchProductById } from "@catalog/services/products";
import ProductDetail from "@catalog/ui/product-detail";
import { Product } from "@/types/api/product-response";

export default async function Page({ params }: { params: { product: string } }) {
  const response = await fetchProductById(params.product);
  const product: Product = response.data;
  return <ProductDetail product={product} />;
}
