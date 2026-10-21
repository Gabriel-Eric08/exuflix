import { Play, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MediaType, Season } from "../api/types";
import { useHrefs } from "../catalog/CatalogContext";
import { useHasSource } from "../player/sources";
import { nextEpisode } from "../player/nextEpisode";
import { useMovieProgress, useSeriesProgress } from "../storage/progress";
import { TrailerButton } from "./Trailer";

interface Props {
  type: MediaType;
  id: number;
  title: string;
  seasons?: Season[];
  trailer?: { key: string } | null;
  variant?: "light" | "primary";
}

/** Rótulo e destino do botão principal conforme o estado salvo (seção 6.6). */
export function usePrimaryAction(type: MediaType, id: number, seasons?: Season[]) {
  const { watch: watchHref, episode: episodeHref } = useHrefs();
  const movie = useMovieProgress(type === "movie" ? id : -1);
  const series = useSeriesProgress(type === "tv" ? id : -1);

  if (type === "movie") {
    if (movie?.completed) return { label: "Assistir de novo", href: watchHref("movie", id), again: true };
    if (movie && movie.position > 30) return { label: "Continuar", href: watchHref("movie", id), again: false };
    return { label: "Assistir", href: watchHref("movie", id), again: false };
  }

  if (series) {
    const { season, episode } = series.current;
    const ep = series.episodes[`s${season}e${episode}`];
    if (ep && !ep.completed) {
      return { label: `Continuar T${season}:E${episode}`, href: episodeHref(id, season, episode), again: false };
    }
    const next = seasons ? nextEpisode(seasons, season, episode) : null;
    if (next) return { label: `Assistir T${next.season}:E${next.episode}`, href: episodeHref(id, next.season, next.episode), again: false };
    if (seasons) return { label: "Assistir de novo", href: episodeHref(id, seasons[0]?.number ?? 1, 1), again: true };
  }
  return { label: "Assistir", href: watchHref("tv", id), again: false };
}

/** Botão "Assistir/Continuar". Sem fonte de vídeo, vira o botão de Trailer. */
export function PlayButton({ type, id, title, seasons, trailer = null, variant = "light" }: Props) {
  const navigate = useNavigate();
  const has = useHasSource(type, id);
  const action = usePrimaryAction(type, id, seasons);

  if (has === undefined) return <span className={`btn btn-${variant}`} style={{ opacity: 0.4, width: 140 }} aria-hidden />;
  if (!has) return <TrailerButton trailer={trailer} title={title} primary />;

  const Icon = action.again ? RotateCcw : Play;
  return (
    <button className={`btn btn-${variant}`} onClick={() => navigate(action.href)}>
      <Icon size={20} fill={action.again ? "none" : "currentColor"} /> {action.label}
    </button>
  );
}
