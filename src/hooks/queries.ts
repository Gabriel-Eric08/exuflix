import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/endpoints";
import { toSummaries, toDetails, toEpisodes } from "../api/normalize";
import type { DiscoverFilters, MediaType, Paged, TmdbListItem } from "../api/types";

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

export const useGenres = (type: MediaType) =>
  useQuery({
    queryKey: ["genres", type],
    queryFn: async () => (await api.genres(type)).genres,
    staleTime: 24 * HOUR,
  });

export const titleQuery = (type: MediaType, id: number) => ({
  queryKey: ["title", type, id],
  queryFn: async () => toDetails(type === "movie" ? await api.movie(id) : await api.tv(id), type),
  staleTime: 6 * HOUR,
});

export const useTitle = (type: MediaType, id: number, enabled = true) =>
  useQuery({ ...titleQuery(type, id), enabled: enabled && id > 0 });

export const useSeason = (tvId: number, season: number) =>
  useQuery({
    queryKey: ["season", tvId, season],
    queryFn: async () => toEpisodes(tvId, await api.season(tvId, season)),
    staleTime: 6 * HOUR,
    enabled: season > 0 && tvId > 0,
  });

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
  return (type: MediaType, id: number) => qc.prefetchQuery(titleQuery(type, id));
}
