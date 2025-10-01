import { fetchProductByDocumentId } from "@ecommerce-front/features/catalog/services/product/get";
import AdmProductDetail from "@catalog/ui/adm-product-detail";
import { updateProduct } from "@ecommerce-front/features/catalog/services/product/mutate";
import { getSizes } from "@ecommerce-front/features/catalog/services/size/get";
import { getTypeProducts } from "@ecommerce-front/features/catalog/services/type-product/get";
import { uploadProductMedia, setProductMedia, deleteProductMedia } from "@ecommerce-front/features/catalog/services/product/media";
import { deleteProduct } from "@ecommerce-front/features/catalog/services/product/delete";
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
        <>
            <h1 className="text-2xl font-bold pt-6 pl-10 mt-16 sm:mt-[72px] lg:mt-20">Editar producto</h1>
            <AdmProductDetail
                product={productData}
                saveAction={updateProduct}
                uploadMediaAction={uploadProductMedia}
                setMediaAction={setProductMedia}
                deleteMediaAction={deleteProductMedia}
                deleteProductAction={deleteProduct}
                sizesOptions={sizesOptions}
                typeOptions={typeOptions}
            />
        </>
    );
}