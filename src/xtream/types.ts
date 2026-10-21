// ---------- Formato cru da Xtream Codes API (só o que usamos) ----------
// Os painéis variam muito: quase tudo pode vir como string, número, null ou ausente.

type Num = number | string | null | undefined;

export interface XtUserInfo {
  username: string;
  password: string;
  auth: Num;
  status?: string; // "Active" | "Expired" | "Banned" | "Disabled"
  exp_date?: Num; // unix (s)
  is_trial?: Num;
  active_cons?: Num;
  max_connections?: Num;
  created_at?: Num;
  allowed_output_formats?: string[];
  message?: string;
}

export interface XtServerInfo {
  url?: string;
  port?: Num;
  https_port?: Num;
  server_protocol?: string; // "http" | "https"
  timezone?: string;
  timestamp_now?: Num;
}

export interface XtAuthResponse {
  user_info?: XtUserInfo;
  server_info?: XtServerInfo;
}

export interface XtCategory {
  category_id: string;
  category_name: string;
  parent_id?: Num;
}

export interface XtVodStream {
  num?: Num;
  name: string;
  stream_type?: string;
  stream_id: Num;
  stream_icon?: string | null;
  rating?: Num;
  rating_5based?: Num;
  added?: Num;
  category_id?: Num;
  category_ids?: Num[];
  container_extension?: string;
  tmdb?: Num;
  tmdb_id?: Num;
  year?: Num;
  plot?: string;
  genre?: string;
}

export interface XtSeries {
  num?: Num;
  name: string;
  series_id: Num;
  cover?: string | null;
  plot?: string | null;
  cast?: string | null;
  director?: string | null;
  genre?: string | null;
  releaseDate?: string | null;
  release_date?: string | null;
  last_modified?: Num;
  rating?: Num;
  rating_5based?: Num;
  backdrop_path?: string[] | string | null;
  youtube_trailer?: string | null;
  episode_run_time?: Num;
  category_id?: Num;
  category_ids?: Num[];
  tmdb?: Num;
  year?: Num;
}

export interface XtLiveStream {
  num?: Num;
  name: string;
  stream_type?: string;
  stream_id: Num;
  stream_icon?: string | null;
  epg_channel_id?: string | null;
  added?: Num;
  category_id?: Num;
  category_ids?: Num[];
  tv_archive?: Num;
  tv_archive_duration?: Num;
}

export interface XtVodInfo {
  info?: {
    name?: string;
    o_name?: string;
    movie_image?: string;
    cover_big?: string;
    backdrop_path?: string[] | string | null;
    plot?: string;
    description?: string;
    cast?: string;
    actors?: string;
    director?: string;
    genre?: string;
    releasedate?: string;
    release_date?: string;
    youtube_trailer?: string;
    duration_secs?: Num;
    duration?: string;
    rating?: Num;
    tmdb_id?: Num;
    age?: string;
    mpaa_rating?: string;
    country?: string;
  } | [];
  movie_data?: {
    stream_id: Num;
    name?: string;
    added?: Num;
    category_id?: Num;
    container_extension?: string;
  };
}

export interface XtEpisode {
  id: Num;
  episode_num: Num;
  title?: string;
  container_extension?: string;
  season?: Num;
  added?: Num;
  info?: {
    plot?: string;
    duration_secs?: Num;
    duration?: string;
    movie_image?: string;
    releasedate?: string;
    rating?: Num;
    name?: string;
  } | [];
}

export interface XtSeriesInfo {
  seasons?: {
    season_number: Num;
    name?: string;
    episode_count?: Num;
    cover?: string | null;
    cover_big?: string | null;
    air_date?: string | null;
  }[];
  info?: XtSeries | [];
  episodes?: Record<string, XtEpisode[]> | XtEpisode[][];
}

export interface XtEpgListing {
  id?: Num;
  title: string; // base64
  description?: string; // base64
  start?: string;
  end?: string;
  start_timestamp?: Num;
  stop_timestamp?: Num;
  now_playing?: Num;
}

export interface XtShortEpg {
  epg_listings?: XtEpgListing[];
}

// ---------- Modelo normalizado ----------

export type XtKind = "vod" | "series" | "live";

export interface LiveChannel {
  key: string; // "live:123"
  id: number;
  name: string;
  logo: string | null;
  categoryIds: number[];
  epgId: string | null;
  archive: boolean;
  archiveDays: number;
  num: number;
}

export interface EpgEntry {
  title: string;
  description: string;
  start: number; // ms
  end: number; // ms
}
