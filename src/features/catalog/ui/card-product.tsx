'use client';
import { Product } from "@/types/api/product-response";
import env from "@/config";
import Image from "next/image";
import styles from "@/styles/catalog/card-product.module.css";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@shared/auth/admin-auth-context";

export default function CardProduct({ data, isList = false }: { data: Product; isList?: boolean }) {
  const router = useRouter();
  const URL = env.strapiUrl;
  // isAdmin
  const { isAdmin } = useAdminAuth();

  const priceNum = data?.price ?? 0;
  const offerPriceNum = data?.offerPrice ?? 0;
  const fixPrice = priceNum.toLocaleString('es-AR');
  const fixOfferPrice = offerPriceNum.toLocaleString('es-AR');

  const handleClick = () => {
    if (isAdmin) {
      router.push(`/admin/edit/product/${data.documentId}`);
    } else {
      router.push(`/product/${data.documentId}`);
    }
  };

  const mainImage = data.media?.[0];
  const imageUrl = mainImage?.url ? `${URL}${mainImage.url}` : "/nullimg.webp";
  const imageAlt = mainImage?.alternativeText || "Producto";

  // legacy classes kept for compatibility but unused in modern card

  const createdAt = data?.createdAt ? new Date(data.createdAt) : null;
  const isNew = createdAt ? (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24) < 14 : false;
  const badgeText = isNew ? 'NEW' : (data.offer ? 'OFERTA' : '');

  if (isList) {
    return (
      <article onClick={handleClick} className={`${styles.modernCardList} ${!data.show ? styles.modernCardDisabled : ''}`}>
        {badgeText && (
          <div className={styles.cardNewBadge}><p>{badgeText}</p></div>
        )}
        <div className={styles.cardListImageWrap}>
          <Image className={styles.cardTopImage} loading="lazy" src={imageUrl} alt={imageAlt} width={320} height={240} unoptimized />
        </div>
        <div className={styles.cardListRight}>
          <p className={styles.cardBottomTitle}>{data.name}</p>
          <div className={`${styles.cardBottomPrice} ${styles.cardBottomPriceList}`}>
            {data.offer ? (
              <>
                <span className={styles.cardOldPrice}>${fixPrice}</span>
                <span className={`${styles.cardPrice} ${styles.cardPriceGreen}`}>${fixOfferPrice}</span>
              </>
            ) : (
              <span className={`${styles.cardPrice} ${styles.cardPriceBlue}`}>${fixPrice}</span>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article onClick={handleClick} className={`${styles.modernCard} ${!data.show ? styles.modernCardDisabled : ''}`}>
      {badgeText && (
        <div className={styles.cardNewBadge}><p>{badgeText}</p></div>
      )}
      <div className={styles.cardBrightFilter} />
      <div className={styles.cardTop}>
        <Image className={styles.cardTopImage} loading="lazy" src={imageUrl} alt={imageAlt} width={600} height={420} unoptimized />
      </div>
      <div className={styles.cardBottom}>
        <p className={styles.cardBottomTitle}>{data.name}</p>
        <div className={styles.cardBottomPrice}>
          {data.offer ? (
            <>
              <span className={styles.cardOldPrice}>${fixPrice}</span>
              <span className={`${styles.cardPrice} ${styles.cardPriceGreen}`}>${fixOfferPrice}</span>
            </>
          ) : (
            <span className={`${styles.cardPrice} ${styles.cardPriceBlue}`}>${fixPrice}</span>
          )}
        </div>
      </div>
    </article>
  );
}
