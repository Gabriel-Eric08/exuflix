import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { TitleSummary } from "../api/types";
import { GridSkeleton, PosterSkeleton } from "./Skeleton";
import { TitleCard } from "./TitleCard";
import styles from "./InfiniteGrid.module.css";

interface Props {
  items: TitleSummary[] | undefined;
  isLoading: boolean;
  isError?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  onRetry?: () => void;
  empty?: React.ReactNode;
  /** Esconde títulos sem pôster (padrão no TMDB; no IPTV o card mostra o nome) */
  requirePoster?: boolean;
}

const MIN_CARD = 120;
const MAX_CARD = 190;

function useColumns(ref: React.RefObject<HTMLElement>, version: number) {
  const [layout, setLayout] = useState({ cols: 6, width: 160, gap: 12, offset: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const gap = w < 600 ? 8 : 12;
      const ideal = w < 480 ? MIN_CARD - 20 : w < 1024 ? MIN_CARD + 20 : MAX_CARD - 20;
      const cols = Math.max(2, Math.floor((w + gap) / (ideal + gap)));
      setLayout({ cols, width: (w - gap * (cols - 1)) / cols, gap, offset: el.getBoundingClientRect().top + window.scrollY });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, version]);
  return layout;
}

/** Grade infinita de pôsteres virtualizada por linhas. */
export function InfiniteGrid({ items, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, onRetry, empty, requirePoster = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { cols, width, gap, offset } = useColumns(ref, items?.length ?? 0);
  const list = requirePoster ? (items ?? []).filter(i => i.poster) : items ?? [];
  const rowCount = Math.ceil(list.length / cols) + (hasNextPage ? 1 : 0);
  const rowHeight = width * 1.5 + gap * 2;

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => rowHeight,
    overscan: 3,
    scrollMargin: offset,
  });

  useEffect(() => {
    virtualizer.measure();
  }, [rowHeight, virtualizer]);

  const virtualRows = virtualizer.getVirtualItems();
  const lastRow = virtualRows[virtualRows.length - 1];
  useEffect(() => {
    if (!lastRow || !hasNextPage || isFetchingNextPage) return;
    if (lastRow.index >= rowCount - 2) fetchNextPage?.();
  }, [lastRow?.index, rowCount, hasNextPage, isFetchingNextPage, fetchNextPage]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.wrap}>
    <div ref={ref}>
      {isLoading ? (
        <div style={{ margin: "0 calc(-1 * var(--gutter))" }}>
          <GridSkeleton count={cols * 3} />
        </div>
      ) : isError && list.length === 0 ? (
        <div className="empty">
          <p style={{ marginBottom: 16 }}>A conexão tropeçou. Tentar de novo?</p>
          {onRetry && <button className="btn btn-primary" onClick={onRetry}>Tentar de novo</button>}
        </div>
      ) : list.length === 0 ? (
        empty ?? <p className="empty">Nada por aqui ainda.</p>
      ) : (
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualRows.map(row => {
            const start = row.index * cols;
            const rowItems = list.slice(start, start + cols);
            return (
              <div
                key={row.key}
                className={styles.row}
                style={{
                  transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gap,
                  paddingBlock: gap,
                }}
              >
                {rowItems.length > 0
                  ? rowItems.map(item => <TitleCard key={item.key} item={item} sizes={`${Math.round(width)}px`} />)
                  : Array.from({ length: cols }, (_, i) => <PosterSkeleton key={i} />)}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </div>
  );
}
