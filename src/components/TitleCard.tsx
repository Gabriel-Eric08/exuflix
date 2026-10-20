import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info, Play, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { TitleDetails, TitleSummary } from "../api/types";
import { useSeriesProgress } from "../storage/progress";
import { useGenres, usePrefetchTitle, useTitle } from "../hooks/queries";
import { useOpenTitle } from "../hooks/useOpenTitle";
import { Artwork } from "./Artwork";
import { Certification } from "./Certification";
import { WatchlistButton } from "./WatchlistButton";
import styles from "./TitleCard.module.css";

const HOVER_DELAY = 300;
const canHover = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

interface Props {
  item: TitleSummary;
  badge?: string | null;
  sizes?: string;
}

export function TitleCard({ item, badge: badgeProp, sizes = "(max-width: 480px) 33vw, (max-width: 1024px) 20vw, 15vw" }: Props) {
  const { openDetails, play } = useOpenTitle();
  const prefetch = usePrefetchTitle();
  const ref = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const badge = useNewEpisodeBadge(item) ?? badgeProp;

  const start = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      prefetch(item.type, item.id);
      if (canHover() && ref.current) setRect(ref.current.getBoundingClientRect());
    }, HOVER_DELAY);
  };
  const cancel = () => clearTimeout(timer.current);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Fecha a prévia se a página rolar
  useEffect(() => {
    if (!rect) return;
    const close = () => setRect(null);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", close, { capture: true });
  }, [rect]);

  return (
    <>
      <button
        ref={ref}
        className={styles.card}
        onClick={() => openDetails(item.type, item.id)}
        onMouseEnter={start}
        onMouseLeave={() => { if (!rect) cancel(); }}
        onFocus={() => prefetch(item.type, item.id)}
        onKeyDown={e => {
          if (e.key === "p" || e.key === "P") {
            e.preventDefault();
            play(item.type, item.id);
          }
        }}
        data-card
        aria-label={item.title}
      >
        <Artwork path={item.poster} kind="poster" title={item.title} sizes={sizes} />
        {badge && <span className={styles.badge}>{badge}</span>}
      </button>
      {rect &&
        createPortal(
          <HoverPreview item={item} badge={badge} rect={rect} onClose={() => setRect(null)} />,
          document.body,
        )}
    </>
  );
}

function HoverPreview({ item, badge, rect, onClose }: { item: TitleSummary; badge?: string | null; rect: DOMRect; onClose: () => void }) {
  const { openDetails, play } = useOpenTitle();
  const { data: details } = useTitle(item.type, item.id);
  const { data: genres } = useGenres(item.type);
  const names = item.genreIds
    .map(id => genres?.find(g => g.id === id)?.name)
    .filter(Boolean)
    .slice(0, 3);

  // Mantém a prévia dentro da janela nas bordas
  const scaledW = rect.width * 1.08;
  const extra = (scaledW - rect.width) / 2;
  let left = rect.left;
  if (rect.left - extra < 8) left = 8 + extra;
  if (rect.right + extra > window.innerWidth - 8) left = window.innerWidth - 8 - extra - rect.width;

  const duration =
    item.type === "movie"
      ? details?.runtime ? formatRuntime(details.runtime) : null
      : details?.seasons ? `${details.seasons.length} temporada${details.seasons.length > 1 ? "s" : ""}` : null;

  return (
    <div
      className={styles.preview}
      style={{ top: rect.top + window.scrollY, left: left + window.scrollX, width: rect.width }}
      onMouseLeave={onClose}
      onClick={() => openDetails(item.type, item.id)}
    >
      <div className={styles.previewArt}>
        <Artwork path={item.poster} kind="poster" title={item.title} sizes="300px" />
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
      <div className={styles.panel}>
        <div className={styles.actions}>
          <button
            className="icon-btn solid"
            aria-label={`Assistir ${item.title}`}
            onClick={e => { e.stopPropagation(); play(item.type, item.id); }}
          >
            <Play size={18} fill="currentColor" />
          </button>
          <WatchlistButton item={item} />
          <button
            className="icon-btn"
            style={{ marginLeft: "auto" }}
            aria-label="Detalhes"
            onClick={e => { e.stopPropagation(); openDetails(item.type, item.id); }}
          >
            <Info size={18} />
          </button>
        </div>
        <div className={`meta ${styles.meta}`}>
          {details?.certification && (
            <span className="no-dot">
              <Certification value={details.certification} />
            </span>
          )}
          {duration && <span className={details?.certification ? undefined : "no-dot"}>{duration}</span>}
          {item.rating > 0 && (
            <span className={styles.rating}>
              <Star size={12} fill="currentColor" /> {item.rating.toFixed(1)}
            </span>
          )}
        </div>
        {names.length > 0 && (
          <div className={`meta ${styles.genres}`}>
            {names.map(n => (
              <span key={n}>{n}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function formatRuntime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${m ? ` ${m}min` : ""}` : `${m}min`;
}

/** "Novo episódio": o último episódio da série saiu depois da última vez que você assistiu. Usa só o cache. */
function useNewEpisodeBadge(item: TitleSummary) {
  const progress = useSeriesProgress(item.type === "tv" ? item.id : -1);
  const qc = useQueryClient();
  if (!progress) return null;
  const details = qc.getQueryData<TitleDetails>(["title", "tv", item.id]);
  const last = details?.lastAirDate ? Date.parse(details.lastAirDate) : NaN;
  return last > progress.updatedAt ? "Novo episódio" : null;
}
