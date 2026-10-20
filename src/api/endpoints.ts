import { tmdb } from "./tmdb";
import type * as T from "./types";

export const api = {
  trending: (type: "all" | "movie" | "tv", window: "day" | "week", page = 1) =>
    tmdb<T.Paged<T.TmdbListItem>>(`/trending/${type}/${window}`, { page }),

  list: (type: "movie" | "tv", list: string, page = 1) =>
    tmdb<T.Paged<T.TmdbListItem>>(`/${type}/${list}`, {
      page,
      region: type === "movie" ? "BR" : undefined,
      timezone: type === "tv" ? "America/Fortaleza" : undefined,
    }),

  genres: (type: "movie" | "tv") => tmdb<{ genres: T.Genre[] }>(`/genre/${type}/list`),

  discover: (type: "movie" | "tv", filters: T.DiscoverFilters, page = 1) =>
    tmdb<T.Paged<T.TmdbListItem>>(`/discover/${type}`, {
      page,
      include_adult: false,
      sort_by: filters.sortBy ?? "popularity.desc",
      with_genres: filters.genreId,
      "vote_count.gte": filters.sortBy?.startsWith("vote_average")
        ? 300
        : filters.sortBy?.includes("date")
          ? 20
          : undefined,
      [type === "movie" ? "primary_release_year" : "first_air_date_year"]: filters.year,
      with_original_language: filters.lang,
      watch_region: "BR",
      ...filters.extra,
    }),

  search: (query: string, page = 1) =>
    tmdb<T.Paged<T.TmdbListItem>>("/search/multi", { query, page, include_adult: false }),

  movie: (id: number) =>
    tmdb<T.TmdbMovieDetails>(`/movie/${id}`, {
      append_to_response: "videos,images,credits,release_dates,watch/providers,recommendations,external_ids",
      include_image_language: "pt,en,null",
      include_video_language: "pt,en",
    }),

  tv: (id: number) =>
    tmdb<T.TmdbTvDetails>(`/tv/${id}`, {
      append_to_response: "videos,images,aggregate_credits,content_ratings,watch/providers,recommendations,external_ids",
      include_image_language: "pt,en,null",
      include_video_language: "pt,en",
    }),

  season: (tvId: number, season: number) => tmdb<T.TmdbSeason>(`/tv/${tvId}/season/${season}`),
};
