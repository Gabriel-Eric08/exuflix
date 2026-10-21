// ---------- Formato cru do TMDB (só o que usamos) ----------

export interface Paged<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbListItem {
  id: number;
  media_type?: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  poster_path?: string | null;
  backdrop_path?: string | null;
  popularity?: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface TmdbVideos {
  results: { key: string; name: string; site: string; type: string; official: boolean; iso_639_1: string }[];
}

export interface TmdbImages {
  logos: { file_path: string; iso_639_1: string | null }[];
  backdrops?: { file_path: string; iso_639_1: string | null }[];
}

export interface TmdbReleaseDates {
  results: { iso_3166_1: string; release_dates: { certification: string; type: number }[] }[];
}

export interface TmdbContentRatings {
  results: { iso_3166_1: string; rating: string }[];
}

interface TmdbCastMember {
  id: number;
  name: string;
  character?: string;
  roles?: { character: string }[];
  profile_path: string | null;
}

interface TmdbCredits {
  cast: TmdbCastMember[];
  crew: { id: number; name: string; job?: string }[];
}

interface TmdbProviders {
  results?: Record<string, { link?: string; flatrate?: { provider_id: number; provider_name: string; logo_path: string | null }[] }>;
}

interface TmdbDetailsBase extends TmdbListItem {
  genres: Genre[];
  tagline?: string;
  videos?: TmdbVideos;
  images?: TmdbImages;
  "watch/providers"?: TmdbProviders;
  recommendations?: Paged<TmdbListItem>;
  external_ids?: { imdb_id?: string | null };
}

export interface TmdbMovieDetails extends TmdbDetailsBase {
  runtime?: number | null;
  credits?: TmdbCredits;
  release_dates?: TmdbReleaseDates;
}

export interface TmdbTvDetails extends TmdbDetailsBase {
  episode_run_time?: number[];
  aggregate_credits?: TmdbCredits;
  content_ratings?: TmdbContentRatings;
  created_by?: { id: number; name: string }[];
  seasons: { season_number: number; name: string; episode_count: number; poster_path: string | null; air_date: string | null }[];
  status?: string;
  last_episode_to_air?: { air_date: string | null } | null;
}

export interface TmdbSeason {
  season_number: number;
  episodes: {
    season_number: number;
    episode_number: number;
    name: string;
    overview: string;
    still_path: string | null;
    runtime: number | null;
    air_date: string | null;
  }[];
}

export interface DiscoverFilters {
  genreId?: number | string;
  sortBy?: string;
  year?: number;
  lang?: string;
  extra?: Record<string, string | number>;
}

// ---------- Modelo da Exuflix ----------

export type MediaType = "movie" | "tv";

export interface TitleSummary {
  key: string; // "movie:550" | "tv:1399"
  id: number;
  type: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  year: number | null;
  rating: number;
  voteCount: number;
  genreIds: number[];
  poster: string | null;
  backdrop: string | null;
  popularity: number;
}

export interface Season {
  number: number;
  name: string;
  episodeCount: number;
  poster: string | null;
  airDate: string | null;
  /** Xtream: id do arquivo do episódio e extensão */
  streamId?: string;
  container?: string;
}

export interface TitleDetails extends TitleSummary {
  genres: Genre[];
  tagline: string | null;
  runtime: number | null;
  certification: string | null;
  logo: string | null;
  trailer: { key: string; name: string } | null;
  cast: { id: number; name: string; character: string; profile: string | null }[];
  creators: string[];
  imdbId: string | null;
  providersBR: { id: number; name: string; logo: string | null }[];
  providersLink: string | null;
  recommendations: TitleSummary[];
  seasons?: Season[];
  status?: string;
  lastAirDate?: string | null;
  /** Xtream: extensão do arquivo do filme (mp4, mkv...) */
  container?: string | null;
}

export interface Episode {
  key: string; // "tv:1399:s1e3"
  season: number;
  episode: number;
  title: string;
  overview: string;
  still: string | null;
  runtime: number | null;
  airDate: string | null;
  /** Xtream: id do arquivo do episódio e extensão */
  streamId?: string;
  container?: string;
}
