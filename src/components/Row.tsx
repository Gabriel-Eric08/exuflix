import { useRef, useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Paged, MediaType, TitleSummary, TmdbListItem } from "../api/types";
import { useRow } from "../hooks/queries";
import { useInView } from "../hooks/useInView";
import { PosterSkeleton, WideSkeleton } from "./Skeleton";
import { TitleCard } from "./TitleCard";
import styles from "./Row.module.css";

export type RowVariant = "poster" | "wide" | "top10";

interface RowProps {
  title: ReactNode;
  seeAllHref?: string;
  variant?: RowVariant;
  children: ReactNode;
}

/** Carrossel horizontal com scroll-snap, setas no desktop e navegação por teclado. */
export function Row({ title, seeAllHref, variant = "poster", children }: RowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = () => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };
  useEffect(updateEdges, [children]);

  const page = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const gutter = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    el.scrollBy({ left: dir * (el.clientWidth - gutter * 2), behavior: "smooth" });
  };

  // Setas ← → movem o foco entre os cards da linha
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const cards = Array.from(trackRef.current?.querySelectorAll<HTMLElement>("[data-card]") ?? []);
    const i = cards.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    const next = cards[i + (e.key === "ArrowRight" ? 1 : -1)];
    if (next) {
      e.preventDefault();
      next.focus();
      next.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }
  };

  return (
    <section className={`${styles.row} ${styles[variant]}`}>
      <h2 className={styles.title}>
        {seeAllHref ? (
          <Link to={seeAllHref} className={styles.titleLink}>
            {title}
            <span className={styles.seeAll}>
              Ver tudo <ChevronRight size={16} />
            </span>
          </Link>
        ) : (
          title
        )}
      </h2>
      <div className={styles.viewport}>
        {!edges.start && (
          <button className={`${styles.arrow} ${styles.left}`} onClick={() => page(-1)} aria-label="Anteriores" tabIndex={-1}>
            <ChevronLeft size={32} />
          </button>
        )}
        <div ref={trackRef} className={styles.track} role="list" onScroll={updateEdges} onKeyDown={onKeyDown}>
          {children}
        </div>
        {!edges.end && (
          <button className={`${styles.arrow} ${styles.right}`} onClick={() => page(1)} aria-label="Próximos" tabIndex={-1}>
            <ChevronRight size={32} />
          </button>
        )}
      </div>
    </section>
  );
}

export function RowItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div role="listitem" className={`${styles.item} ${className}`}>
      {children}
    </div>
  );
}

export function SkeletonRow({ title, variant = "poster" }: { title?: ReactNode; variant?: RowVariant }) {
  return (
    <Row title={title ?? <span className={styles.titleSkeleton} />} variant={variant}>
      {Array.from({ length: 8 }, (_, i) => (
        <RowItem key={i}>{variant === "wide" ? <WideSkeleton /> : <PosterSkeleton />}</RowItem>
      ))}
    </Row>
  );
}

/** Linha de pôsteres a partir de uma lista do TMDB. Só busca quando chega perto do viewport. */
export function QueryRow({
  title,
  queryKey,
  fetcher,
  type,
  seeAllHref,
  variant = "poster",
  filter,
  eager = false,
}: {
  title: string;
  queryKey: (string | number)[];
  fetcher: () => Promise<Paged<TmdbListItem>>;
  type?: MediaType;
  seeAllHref?: string;
  variant?: "poster" | "top10";
  filter?: (t: TitleSummary) => boolean;
  eager?: boolean;
}) {
  const [ref, inView] = useInView<HTMLDivElement>("400px");
  const { data, isLoading, isError } = useRow(queryKey, fetcher, type, eager || inView);
  let items = (data ?? []).filter(t => t.poster);
  if (filter) items = items.filter(filter);
  if (variant === "top10") items = items.slice(0, 10);

  return (
    <div ref={ref} className={styles.slot}>
      {!data && !isError && (isLoading || !inView) ? (
        <SkeletonRow title={title} variant={variant} />
      ) : items.length > 0 ? (
        <Row title={title} seeAllHref={seeAllHref} variant={variant}>
          {items.map((item, i) => (
            <RowItem key={item.key}>
              {variant === "top10" ? (
                <div className={styles.top10Item}>
                  <span className={styles.rank} aria-hidden>
                    {i + 1}
                  </span>
                  <div className={styles.top10Card}>
                    <TitleCard item={item} />
                  </div>
                </div>
              ) : (
                <TitleCard item={item} />
              )}
            </RowItem>
          ))}
        </Row>
      ) : null}
    </div>
  );
}
