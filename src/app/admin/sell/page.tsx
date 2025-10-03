import { fetchAllProducts } from "@ecommerce-front/features/catalog/services/product/get";
import { PosSell } from "@/sales/ui/pos-sell";
import AdminPageActions from "@/shared/ui/admin-page-actions";
import styles from "@/styles/shared/admin-header.module.css";

export default async function Page() {
  const res = await fetchAllProducts();
  const products = Array.isArray(res?.data) ? res.data : [];
  return (
    <div className="p-4 mt-16 sm:mt-[72px] lg:mt-20 max-w-screen-xl mx-auto">
      <div className={styles.header}>
        <h1 className={styles.title}>Ventas</h1>
        <AdminPageActions />
      </div>
      <PosSell initialProducts={products} />
    </div>
  );
}


