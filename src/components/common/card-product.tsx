import styles from "@/components/styles/card-products.module.css";
import { Product } from "@/types/types";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";

export default function CardProduct({ data }: { data: Product }) {
  return (
    <>
      <div className={styles.card}>
        {data.offer && <div className={styles.badge}>Oferta Exclusiva</div>}
        <div className={styles.tilt}>
          <div className={styles.img}>
            <Image
              src={`${process.env.NEXT_PUBLIC_STRAPI_URL}${data.media[0].url}`}
              alt={data.media[0].alternativeText || "Producto"}
              width={400}
              height={400}
              unoptimized
            />
          </div>
        </div>
        <div className={styles.info}>
          <h2 className={styles.title}>{data.name}</h2>
          <p className={styles.desc}>{data.description}</p>
          <div className={styles.bottom}>
            <div className={styles.price}>
              {data.offer ? (
                <>
                  <span className={styles.old}>${data.price}</span>
                  <span className={styles.new}>${data.offerPrice}</span>
                </>
              ) : (
                <span className={styles.new}>${data.price}</span>
              )}
            </div>
            <button className={styles.btn}>
              <span>Add to Cart</span>
              <ShoppingBag size={20} />
            </button>
          </div>
          <div className={styles.meta}>
            <div />
            <div className={styles.stock}>In Stock</div>
          </div>
        </div>
      </div>
    </>
  );
}
