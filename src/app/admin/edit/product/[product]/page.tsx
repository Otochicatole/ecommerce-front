import { fetchProductByDocumentId } from "@catalog/services/products";
import AdmProductDetail from "@catalog/ui/adm-product-detail";
import { updateProduct } from "@/features/catalog/application/update-product";
import { Product } from "@/types/api/product-response";

export default async function Page({ params }: { params: Promise<{ product: string }> }) {
    const { product: productId } = await params;
    const response = await fetchProductByDocumentId(productId);
    const productData: Product = response.data;
    console.log(productData);
    return <AdmProductDetail product={productData} saveAction={updateProduct} />;
}