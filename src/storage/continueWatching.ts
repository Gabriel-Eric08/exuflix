import type { ProgressStore } from "./progress";
import { nextEpisode } from "../player/nextEpisode";

export interface ContinueItem {
  key: string;
  type: "movie" | "tv";
  id: number;
  title: string;
  backdrop: string | null;
  poster: string | null;
  subtitle: string; // "Faltam 38 min" | "T1:E3 · O Cruzamento" | "Próximo: T1:E4"
  progress: number; // 0–1
  href: string;
  updatedAt: number;
}

/** Derivada do progresso salvo, sem chamar a API. */
export function buildContinueWatching(
  store: ProgressStore,
  hidden: string[],
  seasonsOf: (tvId: number) => { number: number; episodeCount: number }[] | undefined,
  base = "",
): ContinueItem[] {
  const out: ContinueItem[] = [];

  for (const item of Object.values(store.items)) {
    const key = `${item.type}:${item.id}`;
    if (hidden.includes(key)) continue;

    if (item.type === "movie") {
      if (item.completed || !item.duration) continue;
      out.push({
        key,
        type: "movie",
        id: item.id,
        title: item.meta.title,
        backdrop: item.meta.backdrop,
        poster: item.meta.poster,
        subtitle: `Faltam ${Math.max(1, Math.ceil((item.duration - item.position) / 60))} min`,
        progress: item.position / item.duration,
        href: `${base}/assistir/filme/${item.id}`,
        updatedAt: item.updatedAt,
      });
      continue;
    }

    const { season, episode } = item.current;
    const ep = item.episodes[`s${season}e${episode}`];
    if (ep && !ep.completed) {
      out.push({
        key,
        type: "tv",
        id: item.id,
        title: item.meta.title,
        backdrop: ep.still ?? item.meta.backdrop,
        poster: item.meta.poster,
        subtitle: `T${season}:E${episode}${ep.title ? ` · ${ep.title}` : ""}`,
        progress: ep.duration ? ep.position / ep.duration : 0,
        href: `${base}/assistir/serie/${item.id}/${season}/${episode}`,
        updatedAt: item.updatedAt,
      });
    } else {
      const seasons = seasonsOf(item.id);
      const next = seasons ? nextEpisode(seasons, season, episode) : null;
      if (!next) continue; // terminou a série (ou temporadas ainda não carregadas)
      out.push({
        key,
        type: "tv",
        id: item.id,
        title: item.meta.title,
        backdrop: item.meta.backdrop,
        poster: item.meta.poster,
        subtitle: `Próximo: T${next.season}:E${next.episode}`,
        progress: 0,
        href: `${base}/assistir/serie/${item.id}/${next.season}/${next.episode}`,
        updatedAt: item.updatedAt,
      });
    }
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20);
}
