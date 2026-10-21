import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Episode, Genre, MediaType, TitleDetails } from "../api/types";
import { api } from "../api/endpoints";
import { toDetails, toEpisodes } from "../api/normalize";
import { detailsHref, episodeHref, watchHref } from "../app/routes";

const HOUR = 60 * 60 * 1000;

interface QueryDef<T> {
  queryKey: readonly unknown[];
  queryFn: () => Promise<T>;
  staleTime: number;
}

/**
 * De onde vem o catálogo que os componentes (cards, destaque, detalhes, players) mostram.
 * Exuflix = TMDB; Marcondes de Oxóssi = Xtream Codes (em /pai-marcondes).
 */
export interface Catalog {
  id: "tmdb" | "xtream";
  name: string;
  /** Prefixo das rotas ("" ou "/pai-marcondes") */
  base: string;
  /** Prefixo das chaves de storage (progresso, lista, removidos) */
  ns: string;
  titleQuery: (type: MediaType, id: number) => QueryDef<TitleDetails>;
  seasonQuery: (tvId: number, season: number) => QueryDef<Episode[]>;
  genresQuery: (type: MediaType) => QueryDef<Genre[]>;
}

export const tmdbCatalog: Catalog = {
  id: "tmdb",
  name: "Exuflix",
  base: "",
  ns: "",
  titleQuery: (type, id) => ({
    queryKey: ["title", type, id],
    queryFn: async () => toDetails(type === "movie" ? await api.movie(id) : await api.tv(id), type),
    staleTime: 6 * HOUR,
  }),
  seasonQuery: (tvId, season) => ({
    queryKey: ["season", tvId, season],
    queryFn: async () => toEpisodes(tvId, await api.season(tvId, season)),
    staleTime: 6 * HOUR,
  }),
  genresQuery: type => ({
    queryKey: ["genres", type],
    queryFn: async () => (await api.genres(type)).genres,
    staleTime: 24 * HOUR,
  }),
};

const CatalogContext = createContext<Catalog>(tmdbCatalog);

export function CatalogProvider({ value, children }: { value: Catalog; children: ReactNode }) {
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);

/** Rotas de detalhes/play já com o prefixo do catálogo atual. */
export function useHrefs() {
  const { base } = useCatalog();
  return useMemo(
    () => ({
      base,
      details: (t: MediaType, id: number) => detailsHref(t, id, base),
      watch: (t: MediaType, id: number) => watchHref(t, id, base),
      episode: (id: number, s: number, e: number) => episodeHref(id, s, e, base),
      to: (path: string) => (path === "/" ? base || "/" : base + path),
    }),
    [base],
  );
}
