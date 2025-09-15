'use client';
import styles from "@/styles/catalog/card-product-skeleton.module.css";

export default function CardProductSkeleton({ isList }: { isList?: boolean }) {
  const rootClass = isList ? styles.skeletonList : styles.skeleton;
  return (
    <article className={rootClass}>
      <div className={styles.skeletonImage}></div> 
      <section className={styles.skeletonContent}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonDescription}></div>
        <div className={styles.skeletonFooter}></div>
      </section>
    </article>
  );
}
