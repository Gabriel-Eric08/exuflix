import styles from "./Skeleton.module.css";

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`${styles.sk} ${className}`} style={style} aria-hidden />;
}

export function PosterSkeleton() {
  return <Skeleton className={styles.poster} />;
}

export function WideSkeleton() {
  return <Skeleton className={styles.wide} />;
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="poster-grid" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <PosterSkeleton key={i} />
      ))}
    </div>
  );
}
