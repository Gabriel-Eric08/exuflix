import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/endpoints";
import { toSummaries } from "../api/normalize";
import type { DiscoverFilters, MediaType, Paged, TmdbListItem } from "../api/types";
import { tmdbCatalog, useCatalog } from "../catalog/CatalogContext";

const HOUR = 60 * 60 * 1000;

export const useRow = (
  key: (string | number)[],
  fn: () => Promise<Paged<TmdbListItem>>,
  type?: MediaType,
  enabled = true,
) =>
  useQuery({
    queryKey: ["row", ...key],
    queryFn: async () => toSummaries((await fn()).results, type),
    staleTime: HOUR,
    enabled,
  });

/** Gêneros (TMDB) ou categorias (Xtream), conforme o catálogo atual. */
export const useGenres = (type: MediaType) => useQuery(useCatalog().genresQuery(type));

/** Detalhes no TMDB (fora de um CatalogProvider). */
export const titleQuery = tmdbCatalog.titleQuery;

export const useTitle = (type: MediaType, id: number, enabled = true) =>
  useQuery({ ...useCatalog().titleQuery(type, id), enabled: enabled && id > 0 });

export const useSeason = (tvId: number, season: number) => {
  const catalog = useCatalog();
  // Xtream pode ter "temporada 0" de verdade; no TMDB a 0 são os especiais, fora da lista
  const minSeason = catalog.id === "xtream" ? 0 : 1;
  return useQuery({ ...catalog.seasonQuery(tvId, season), enabled: season >= minSeason && tvId > 0 });
};

export const useDiscover = (type: MediaType, filters: DiscoverFilters, enabled = true) =>
  useInfiniteQuery({
    queryKey: ["discover", type, filters],
    queryFn: ({ pageParam }) => api.discover(type, filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: last => (last.page < Math.min(last.total_pages, 500) ? last.page + 1 : undefined),
    select: data => data.pages.flatMap(p => toSummaries(p.results, type)),
    staleTime: HOUR,
    enabled,
  });

export const useSearch = (query: string) =>
  useInfiniteQuery({
    queryKey: ["search", query],
    queryFn: ({ pageParam }) => api.search(query, pageParam),
    initialPageParam: 1,
    getNextPageParam: last => (last.page < Math.min(last.total_pages, 500) ? last.page + 1 : undefined),
    select: data => data.pages.flatMap(p => toSummaries(p.results)),
    staleTime: HOUR,
    enabled: query.trim().length >= 2,
  });

/** Prefetch dos detalhes quando o card recebe hover/foco */
export function usePrefetchTitle() {
  const qc = useQueryClient();
  const catalog = useCatalog();
  return (type: MediaType, id: number) => qc.prefetchQuery(catalog.titleQuery(type, id));
}
