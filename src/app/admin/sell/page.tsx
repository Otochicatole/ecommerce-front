import { fetchAllProducts } from "@ecommerce-front/features/catalog/services/product/get";
import { PosSell } from "@/sales/ui/pos-sell";

export default async function Page() {
  const res = await fetchAllProducts();
  const products = Array.isArray(res?.data) ? res.data : [];
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Ventas presenciales</h1>
      <PosSell initialProducts={products} />
    </div>
  );
}


