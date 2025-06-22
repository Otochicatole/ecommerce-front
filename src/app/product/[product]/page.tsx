'use client';

import style from "./components/styles/default.module.css";
import Box from "@/components/ui/box";
import { fetchProductById } from "@/lib/get-products";
import { Product } from "@/types/types";
import { useEffect, useState } from "react";

export default function Page({ params }: { params: Promise<{ product: string }> }) {
  const [data, setData] = useState<Product>({} as Product);
  const [productId, setProductId] = useState<string>("");

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setProductId(resolvedParams.product);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (productId) {
      const fetchData = async () => {
        const data = await fetchProductById(productId);
        setData(data.data);
      };
      fetchData();
    }
  }, [productId]);

  return (
    <div className={style.container}>
      <Box>
        <div className={style.containerSection}>
          <section className={style.leftSection}>
            <div>asd</div>
          </section>
          <section className={style.rightSection}>
            {data.name}
            {data.description}
          </section>
        </div>
      </Box>
    </div>
  );
}
