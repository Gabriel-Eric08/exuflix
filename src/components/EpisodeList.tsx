import { useEffect, useRef } from "react";
import { Check, Play } from "lucide-react";
import type { Season } from "../api/types";
import { useSeason } from "../hooks/queries";
import { useEpisodeSources } from "../player/sources";
import { useSeriesProgress } from "../storage/progress";
import { Artwork } from "./Artwork";
import { Skeleton } from "./Skeleton";
import styles from "./EpisodeList.module.css";

export function SeasonSelect({
  seasons,
  value,
  onChange,
}: {
  seasons: Season[];
  value: number;
  onChange: (s: number) => void;
}) {
  if (seasons.length === 0) return null;
  return (
    <select className="select" value={value} onChange={e => onChange(Number(e.target.value))} aria-label="Temporada">
      {seasons.map(s => (
        <option key={s.number} value={s.number}>
          {s.name || `Temporada ${s.number}`} · {s.episodeCount} episódio{s.episodeCount === 1 ? "" : "s"}
        </option>
      ))}
    </select>
  );
}

interface Props {
  tvId: number;
  season: number;
  current?: { season: number; episode: number };
  onPick: (season: number, episode: number) => void;
  compact?: boolean;
}

/** Lista de episódios com progresso salvo, ✓ dos concluídos e "Em breve" sem fonte. */
export function EpisodeList({ tvId, season, current, onPick, compact = false }: Props) {
  const { data: episodes, isLoading, isError, refetch } = useSeason(tvId, season);
  const sources = useEpisodeSources(tvId);
  const progress = useSeriesProgress(tvId);
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center" });
  }, [episodes, current?.season, current?.episode]);

  if (isLoading) {
    return (
      <div className={styles.list}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} style={{ height: compact ? 88 : 110 }} />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <p className={styles.error}>
        A conexão tropeçou. <button className={styles.retry} onClick={() => refetch()}>Tentar de novo?</button>
      </p>
    );
  }

  return (
    <ol className={`${styles.list} ${compact ? styles.compact : ""}`}>
      {(episodes ?? []).map(ep => {
        const k = `s${ep.season}e${ep.episode}`;
        const saved = progress?.episodes[k];
        const available = sources.has(k);
        const isCurrent = current?.season === ep.season && current?.episode === ep.episode;
        const pct = saved ? (saved.completed ? 1 : saved.position / (saved.duration || 1)) : 0;
        return (
          <li key={ep.key}>
            <button
              ref={isCurrent ? currentRef : undefined}
              className={`${styles.ep} ${isCurrent ? styles.current : ""} ${available ? "" : styles.unavailable}`}
              onClick={() => available && onPick(ep.season, ep.episode)}
              aria-disabled={!available}
              aria-current={isCurrent || undefined}
            >
              <span className={styles.number}>{ep.episode}</span>
              <span className={styles.thumb}>
                <Artwork path={ep.still} kind="still" title={ep.title} sizes="300px" />
                {available && (
                  <span className={styles.playIcon} aria-hidden>
                    <Play size={20} fill="currentColor" />
                  </span>
                )}
                {saved?.completed && (
                  <span className={styles.done} aria-label="Assistido">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
                {pct > 0 && !saved?.completed && (
                  <span className={styles.bar}>
                    <span style={{ width: `${pct * 100}%` }} />
                  </span>
                )}
              </span>
              <span className={styles.info}>
                <span className={styles.head}>
                  <span className={styles.epTitle}>{ep.title}</span>
                  {ep.runtime ? <span className={`${styles.runtime} tabular`}>{ep.runtime} min</span> : null}
                </span>
                {isCurrent && <span className={styles.label}>Assistindo</span>}
                {!available && <span className={styles.soon}>Em breve</span>}
                <span className={styles.overview}>{ep.overview || "Sinopse ainda não disponível."}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
