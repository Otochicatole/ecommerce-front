import { fetchProductByDocumentId } from "@catalog/services/products";
import AdmProductDetail from "@catalog/ui/adm-product-detail";
import { updateProduct } from "@/features/catalog/application/update-product";
import { getSizes } from "@/features/catalog/application/size-actions";
import { getTypeProducts } from "@/features/catalog/application/type-product-actions";
import { uploadProductMedia, setProductMedia, deleteProductMedia } from "@/features/catalog/application/product-media-actions";
import { Product } from "@/types/api/product-response";

export default async function Page({ params }: { params: Promise<{ product: string }> }) {
    const { product: productId } = await params;
    const response = await fetchProductByDocumentId(productId);
    const productData: Product = response.data;
    const [sizesRes, typesRes] = await Promise.all([
        getSizes({ page: 1, pageSize: 200 }),
        getTypeProducts({ page: 1, pageSize: 200 }),
    ]);

    const sizesOptions = Array.isArray(sizesRes?.data) ? sizesRes.data : [];
    const typeOptions = Array.isArray(typesRes?.data) ? typesRes.data : [];

    return (
        <AdmProductDetail
            product={productData}
            saveAction={updateProduct}
            uploadMediaAction={uploadProductMedia}
            setMediaAction={setProductMedia}
            deleteMediaAction={deleteProductMedia}
            sizesOptions={sizesOptions}
            typeOptions={typeOptions}
        />
    );
}