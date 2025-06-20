import styles from "../styles/card-product.module.css";

export default function CardProductSkeleton() {
  return (
    <article className={styles.skeleton}>
      <div className={styles.skeletonImage}></div>
      <section className={styles.skeletonContent}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonDescription}></div>
        <div className={styles.skeletonFooter}></div>
      </section>
    </article>
  );
}