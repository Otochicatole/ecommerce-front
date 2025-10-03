'use server';
import AdmProductDetail from "@catalog/ui/adm-product-detail";
import AdminPageActions from "@/shared/ui/admin-page-actions";
import type { Product } from "@/types/api/product-response";
import styles from "@/styles/shared/admin-header.module.css";
import { createProduct } from "@ecommerce-front/features/catalog/services/product/create";
import { uploadProductMedia, setProductMedia, deleteProductMedia } from "@ecommerce-front/features/catalog/services/product/media";
import { getSizes } from "@ecommerce-front/features/catalog/services/size/get";
import { getTypeProducts } from "@ecommerce-front/features/catalog/services/type-product/get";

export default async function Page() {
    const [sizesRes, typesRes] = await Promise.all([
        getSizes({ page: 1, pageSize: 200 }),
        getTypeProducts({ page: 1, pageSize: 200 }),
    ]);

    const sizesOptions = Array.isArray(sizesRes?.data) ? sizesRes.data : [];
    const typeOptions = Array.isArray(typesRes?.data) ? typesRes.data : [];

    const emptyProduct: Product = {
        id: 0,
        documentId: "",
        name: "",
        description: [],
        price: 0,
        offerPrice: 0,
        offer: false,
        stock: 0,
        createdAt: "",
        updatedAt: "",
        publishedAt: "",
        show: true,
        media: [],
        sizes: [],
        type_products: [],
    } as unknown as Product;

    return (
        <>
            <div className={`px-10 mt-16 sm:mt-[72px] lg:mt-20 ${styles.header}`}>
                <h1 className={styles.title}>Crear producto</h1>
                <AdminPageActions />
            </div>
            <AdmProductDetail
                product={emptyProduct}
                saveAction={createProduct}
                uploadMediaAction={uploadProductMedia}
                setMediaAction={setProductMedia}
                deleteMediaAction={deleteProductMedia}
                sizesOptions={sizesOptions}
                typeOptions={typeOptions}
            />
        </>
    );
}
