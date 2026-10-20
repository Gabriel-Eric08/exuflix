import { useState } from "react";
import { img, posterSrcSet, backdropSrcSet } from "../api/images";
import styles from "./Artwork.module.css";

interface Props {
  path: string | null;
  kind: "poster" | "backdrop" | "still";
  title: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/** Imagem do TMDB com proporção fixa (sem CLS) e fallback com o título + X em marca d'água. */
export function Artwork({ path, kind, title, sizes, priority = false, className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const ratio = kind === "poster" ? styles.poster : styles.wide;

  if (!path || failed) {
    return (
      <div className={`${styles.frame} ${ratio} ${styles.fallback} ${className}`} role="img" aria-label={title}>
        <span className={styles.watermark} aria-hidden>
          X
        </span>
        <span className={styles.fallbackTitle}>{title}</span>
      </div>
    );
  }

  const src = kind === "poster" ? img(path, "w342") : kind === "still" ? img(path, "w300") : img(path, "w780");
  const srcSet = kind === "poster" ? posterSrcSet(path) : kind === "backdrop" ? backdropSrcSet(path) : undefined;

  return (
    <div className={`${styles.frame} ${ratio} ${className}`}>
      <img
        src={src!}
        srcSet={srcSet}
        sizes={sizes}
        alt={title}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        // @ts-expect-error atributo ainda não tipado no React 18
        fetchpriority={priority ? "high" : undefined}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
