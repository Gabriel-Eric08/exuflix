import { useQuery } from "@tanstack/react-query";
import type { MediaType, TitleSummary } from "../api/types";
import { queryClient } from "../app/queryClient";
import { XT_BASE } from "../app/routes";
import type { Catalog } from "../catalog/CatalogContext";
import { xtreamCall } from "./client";
import {
  epgOf,
  episodesOf,
  liveToChannel,
  seriesInfoToDetails,
  seriesToSummary,
  toGenres,
  toSummaries,
  vodInfoToDetails,
  vodToSummary,
} from "./normalize";
import type { XtCategory, XtKind, XtLiveStream, XtSeries, XtSeriesInfo, XtShortEpg, XtVodInfo, XtVodStream } from "./types";

const MIN = 60 * 1000;
const kindOf = (t: MediaType): XtKind => (t === "movie" ? "vod" : "series");

const CATEGORY_ACTION: Record<XtKind, string> = {
  vod: "get_vod_categories",
  series: "get_series_categories",
  live: "get_live_categories",
};

// Todas as queries Xtream começam com "xt": login/logout limpa tudo de uma vez.

export const categoriesQuery = (kind: XtKind) => ({
  queryKey: ["xt", "cats", kind] as const,
  queryFn: async () => toGenres(await xtreamCall<XtCategory[]>(CATEGORY_ACTION[kind])),
  staleTime: 30 * MIN,
});

/** Lista completa de filmes ou séries (uma chamada; o resto é filtrado localmente). */
export const titlesQuery = (type: MediaType) => ({
  queryKey: ["xt", "list", type] as const,
  queryFn: async () =>
    type === "movie"
      ? toSummaries(await xtreamCall<XtVodStream[]>("get_vod_streams"), vodToSummary)
      : toSummaries(await xtreamCall<XtSeries[]>("get_series"), seriesToSummary),
  staleTime: 30 * MIN,
});

export const liveQuery = () => ({
  queryKey: ["xt", "list", "live"] as const,
  queryFn: async () => {
    const raw = await xtreamCall<XtLiveStream[]>("get_live_streams");
    return (Array.isArray(raw) ? raw : []).map(liveToChannel).filter((c): c is NonNullable<typeof c> => !!c);
  },
  staleTime: 30 * MIN,
});

const seriesInfoQuery = (id: number) => ({
  queryKey: ["xt", "series-info", id] as const,
  queryFn: () => xtreamCall<XtSeriesInfo>("get_series_info", { series_id: id }),
  staleTime: 30 * MIN,
});

/** Item da lista (se já carregada) para completar o que o get_*_info não traz. */
async function fromList(type: MediaType, id: number) {
  try {
    const all = await queryClient.ensureQueryData(titlesQuery(type));
    return { all, item: all.find(t => t.id === id) };
  } catch {
    return { all: [] as TitleSummary[], item: undefined };
  }
}

/** "Títulos semelhantes": mesma categoria, mais recentes primeiro. */
function similar(all: TitleSummary[], item: TitleSummary | undefined) {
  if (!item || item.genreIds.length === 0) return [];
  const cat = item.genreIds[0];
  return all
    .filter(t => t.id !== item.id && t.genreIds.includes(cat) && t.poster)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 12);
}

export const xtTitleQuery = (type: MediaType, id: number) => ({
  queryKey: ["xt", "title", type, id] as const,
  queryFn: async () => {
    const [{ all, item }, details] = await Promise.all([
      fromList(type, id),
      type === "movie"
        ? xtreamCall<XtVodInfo>("get_vod_info", { vod_id: id })
        : queryClient.ensureQueryData(seriesInfoQuery(id)),
    ]);
    const d =
      type === "movie"
        ? vodInfoToDetails(id, details as XtVodInfo, item)
        : seriesInfoToDetails(id, details as XtSeriesInfo, item);
    return { ...d, recommendations: similar(all, item) };
  },
  staleTime: 30 * MIN,
});

export const xtSeasonQuery = (tvId: number, season: number) => ({
  queryKey: ["xt", "season", tvId, season] as const,
  queryFn: async () => episodesOf(tvId, await queryClient.ensureQueryData(seriesInfoQuery(tvId)), season),
  staleTime: 30 * MIN,
});

export const xtreamCatalog: Catalog = {
  id: "xtream",
  name: "Marcondes de Oxóssi",
  base: XT_BASE,
  ns: "xt:",
  titleQuery: xtTitleQuery,
  seasonQuery: xtSeasonQuery,
  genresQuery: type => categoriesQuery(kindOf(type)),
};

// ---------- Hooks ----------

export const useXtTitles = (type: MediaType, enabled = true) => useQuery({ ...titlesQuery(type), enabled });
export const useXtCategories = (kind: XtKind) => useQuery(categoriesQuery(kind));
export const useXtLive = () => useQuery(liveQuery());

export const useXtEpg = (streamId: number, enabled = true, limit = 4) =>
  useQuery({
    queryKey: ["xt", "epg", streamId, limit],
    queryFn: async () => epgOf((await xtreamCall<XtShortEpg>("get_short_epg", { stream_id: streamId, limit }))?.epg_listings),
    staleTime: 5 * MIN,
    enabled: enabled && streamId > 0,
  });

// ---------- Busca local ----------

export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Todas as palavras do termo aparecem no título (sem acento/caixa); começa-com vem antes. */
export function searchTitles(items: TitleSummary[], query: string, limit = 300): TitleSummary[] {
  const q = fold(query.trim());
  if (q.length < 2) return [];
  const words = q.split(/\s+/);
  const hits: { t: TitleSummary; score: number }[] = [];
  for (const t of items) {
    const name = fold(t.title);
    if (!words.every(w => name.includes(w))) continue;
    hits.push({ t, score: name.startsWith(q) ? 0 : name.includes(q) ? 1 : 2 });
  }
  return hits
    .sort((a, b) => a.score - b.score || b.t.popularity - a.t.popularity)
    .slice(0, limit)
    .map(h => h.t);
}
