'use client';
import { Product } from "@/types/api/product-response";
import env from "@/config";
import Image from "next/image";
import styles from "@/styles/catalog/card-product.module.css";
import { useRouter } from "next/navigation";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";

export default function CardProduct({ data }: { data: Product }) {
  const router = useRouter();
  const URL = env.strapiUrl;

  const fixPrice = data.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const fixOfferPrice = data.offerPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const handleClick = () => {
    router.push(`/product/${data.documentId}`);
  };

  const mainImage = data.media?.[0];
  const imageUrl = mainImage?.url ? `${URL}${mainImage.url}` : "/nullimg.webp";
  const imageAlt = mainImage?.alternativeText || "Producto";

  return (
    <article onClick={handleClick} className={data.show ? styles.article : styles.articleDisabled}>
      {data.offer && <span className={styles.offer}>Oferta Exclusiva</span>}
      <figure className={styles.figure}>
        <Image className="object-cover w-fit h-fit" loading="lazy" src={imageUrl} alt={imageAlt} width={400} height={400} unoptimized />
      </figure>
      <section className={styles.section}>
        <div className={styles.header}>
          <div className={styles["header-texto"]}>
            <h1 className={styles.title}>{data.name}</h1>
            <div className={styles.desc}>
              {data?.description ? <BlocksRenderer content={data.description} /> : <p>No description available.</p>}
            </div>
          </div>
        </div>
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.priceContainer}>
              {data.offer ? (
                <>
                  <p className={styles.offerPrice}>${fixPrice}</p>
                  <p className={styles.price}>
                    ${fixOfferPrice}
                    <span className={styles.discount}>{Math.round(((Number(data.price) - Number(data.offerPrice)) / Number(data.price)) * 100)}% OFF</span>
                  </p>
                </>
              ) : (
                <span className={styles.price}>${fixPrice}</span>
              )}
            </div>
          </div>
          <div className={styles.footerDescription}>
            <br />
            {data.show ? <span style={{ color: "#4ea84e" }}>En stock</span> : <span style={{ color: "#9b1313", fontSize: 16 }}>Sin stock</span>}
          </div>
        </footer>
      </section>
    </article>
  );
}
