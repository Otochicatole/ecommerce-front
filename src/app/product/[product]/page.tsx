import { fetchProductById } from "@/lib/get-products";
import ProductDetail from "@/components/product/product-detail";
import { Product } from "@/types/api/product-response";

export default async function Page({ params }: { params: { product: string } }) {
  const response = await fetchProductById(params.product);
  const product: Product = response.data;
  return <ProductDetail product={product} />;
}
