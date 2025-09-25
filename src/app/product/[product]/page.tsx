import { fetchProductByDocumentId } from "@ecommerce-front/features/catalog/services/product/get";
import ProductDetail from "@catalog/ui/product-detail";
import { Product } from "@/types/api/product-response";

export default async function Page({ params }: { params: Promise<{ product: string }> }) {
  const { product: productId } = await params;
  const response = await fetchProductByDocumentId(productId);
  const productData: Product = response.data;
  return <ProductDetail product={productData} />;
}
