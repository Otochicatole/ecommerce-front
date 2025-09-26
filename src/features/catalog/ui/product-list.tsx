'use client';
import CardProduct from "./card-product";
import CardProductSkeleton from "./card-product-skeleton";
import { Product } from "@/types/api/product-response";
import SearchBar from "./search-bar";
import Link from "next/link";
import { TextPromptDialog } from "@/shared/ui/text-prompt-dialog";
import { createSize, deleteSize } from "@ecommerce-front/features/catalog/services/size/mutate";
import { createTypeProduct } from "@ecommerce-front/features/catalog/services/type-product/mutate";
import { getSizes } from "@ecommerce-front/features/catalog/services/size/get";
import { getTypeProducts } from "@ecommerce-front/features/catalog/services/type-product/get";
import toast from "react-hot-toast";
import { fetchProductsBySearch } from "@ecommerce-front/features/catalog/services/product/get";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  onSearchActiveChange?: (active: boolean) => void;
}

export default function ProductList({ products, onSearchActiveChange }: ProductGridProps) {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Product[] | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [openSize, setOpenSize] = useState(false);
  const [openType, setOpenType] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sizes, setSizes] = useState<Array<{ id: number; documentId?: string; size: string }>>([]);
  const [types, setTypes] = useState<Array<{ id: number; documentId?: string; type: string }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, t] = await Promise.all([
          getSizes({ page: 1, pageSize: 200 }),
          getTypeProducts({ page: 1, pageSize: 200 }),
        ]);
        setSizes(Array.isArray(s?.data) ? s.data : []);
        setTypes(Array.isArray(t?.data) ? t.data : []);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    (async () => {
      try {
        const response = await fetchProductsBySearch(trimmed);
        if (!cancelled) setResults(response.data as Product[]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    const isActive = query.trim().length > 0;
    onSearchActiveChange?.(isActive);
  }, [query, onSearchActiveChange]);

  if (!products || products.length === 0) {
    return (
      <ul className="flex flex-col gap-4 p-3">
        {Array.from({ length: 10 }).map((_, index) => (
          <CardProductSkeleton isList={true} key={index} />
        ))}
      </ul>
    );
  }

  return (
  <>
      <div className="flex items-center justify-between px-3">
        <SearchBar value={query} onChange={setQuery} />
        <div className="flex items-center gap-2">
          <Link href="/admin/create" className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-xs text-white hover:bg-gray-800">
            crear producto
          </Link>
          <button type="button" onClick={() => setOpenSize(true)} className="inline-flex items-center rounded-md bg-gray-700 px-3 py-2 text-xs text-white hover:bg-gray-600">crear size</button>
          <button type="button" onClick={() => setOpenType(true)} className="inline-flex items-center rounded-md bg-gray-700 px-3 py-2 text-xs text-white hover:bg-gray-600">crear type</button>
        </div>
      </div>
        {isSearching ? (
          <ul className="flex flex-col gap-4 p-3">
            {Array.from({ length: 10 }).map((_, index) => (
              <CardProductSkeleton isList={true} key={index} />
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-4 p-3">
            {(results ?? products).map((product) => (
              <CardProduct isList={true} key={product.id} data={product} />
            ))}
          </ul>
        )}
      <TextPromptDialog
        open={openSize}
        title="crear size"
        label="size"
        placeholder="ej: XL"
        validate={(v) => {
          const trimmed = v.trim();
          if (!trimmed) return 'requerido';
          const normalized = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '');
          if (!/^[A-Z0-9]+$/.test(normalized)) return 'solo letras o números';
          return null;
        }}
        onCancel={() => setOpenSize(false)}
        loading={isSaving}
        contentBelow={(
          <ul className="divide-y divide-gray-200 text-sm">
            {sizes.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-3 py-2">
                <span>{s.size}</span>
                <button
                  type="button"
                  className="text-red-600 hover:underline cursor-pointer"
                  onClick={async () => {
                    try {
                      setIsSaving(true);
                      await deleteSize(String(s.documentId ?? s.id));
                      setSizes(prev => prev.filter(x => x.id !== s.id));
                      toast.success('size eliminado');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
            {sizes.length === 0 && <li className="px-3 py-2 text-gray-500">no hay sizes</li>}
          </ul>
        )}
        onConfirm={async (value) => {
          try {
            setIsSaving(true);
            await createSize({ size: value });
            setOpenSize(false);
            toast.success('size creado');
            const s = await getSizes({ page: 1, pageSize: 200 });
            setSizes(Array.isArray(s?.data) ? s.data : []);
          } finally {
            setIsSaving(false);
          }
        }}
      />
      <TextPromptDialog
        open={openType}
        title="crear type"
        label="type"
        placeholder="ej: remera"
        validate={(v) => {
          const trimmed = v.trim();
          if (!trimmed) return 'requerido';
          const normalized = trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
          if (!/^[a-z0-9\s]+$/.test(normalized)) return 'solo letras, números y espacios';
          return null;
        }}
        onCancel={() => setOpenType(false)}
        loading={isSaving}
        contentBelow={(
          <ul className="divide-y divide-gray-200 text-sm">
            {types.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-3 py-2">
                <span>{t.type}</span>
                <button
                  type="button"
                  className="text-red-600 hover:underline cursor-pointer"
                  onClick={async () => {
                    try {
                      setIsSaving(true);
                      // delete by id or documentId using existing service
                      const { deleteTypeProduct } = await import("@ecommerce-front/features/catalog/services/type-product/mutate");
                      await deleteTypeProduct(String(t.documentId ?? t.id));
                      setTypes(prev => prev.filter(x => x.id !== t.id));
                      toast.success('type eliminado');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
            {types.length === 0 && <li className="px-3 py-2 text-gray-500">no hay types</li>}
          </ul>
        )}
        onConfirm={async (value) => {
          try {
            setIsSaving(true);
            await createTypeProduct({ type: value });
            setOpenType(false);
            toast.success('type creado');
            const t = await getTypeProducts({ page: 1, pageSize: 200 });
            setTypes(Array.isArray(t?.data) ? t.data : []);
          } finally {
            setIsSaving(false);
          }
        }}
      />
    </>
  );
}
