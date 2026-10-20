import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../api/endpoints";
import { toSummaries } from "../api/normalize";
import type { MediaType } from "../api/types";

/** Lista paginada do TMDB (now_playing, on_the_air...) para grades infinitas. */
export const useInfiniteList = (type: MediaType, list: string, enabled = true) =>
  useInfiniteQuery({
    queryKey: ["list", type, list],
    queryFn: ({ pageParam }) => api.list(type, list, pageParam),
    initialPageParam: 1,
    getNextPageParam: last => (last.page < Math.min(last.total_pages, 500) ? last.page + 1 : undefined),
    select: data => data.pages.flatMap(p => toSummaries(p.results, type)),
    staleTime: 60 * 60 * 1000,
    enabled,
  });
