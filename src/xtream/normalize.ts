import type { Episode, Genre, Season, TitleDetails, TitleSummary } from "../api/types";
import type {
  EpgEntry,
  LiveChannel,
  XtCategory,
  XtEpgListing,
  XtEpisode,
  XtLiveStream,
  XtSeries,
  XtSeriesInfo,
  XtVodInfo,
  XtVodStream,
} from "./types";

// ---------- Helpers tolerantes (os painéis mandam de tudo) ----------

export const toNum = (v: unknown): number | null => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());

const url = (v: unknown): string | null => {
  const s = str(v);
  return /^https?:\/\//i.test(s) ? s : null;
};

const firstUrl = (v: unknown): string | null => (Array.isArray(v) ? v.map(url).find(Boolean) ?? null : url(v));

const objOrEmpty = <T extends object>(v: T | [] | undefined | null): Partial<T> => (v && !Array.isArray(v) ? v : {});

const list = (s: unknown) =>
  str(s)
    .split(/\s*[,/|]\s*/)
    .map(x => x.trim())
    .filter(Boolean);

/** Texto base64 (UTF-8) da EPG; se não for base64 válido, devolve como veio. */
export function b64(s: unknown): string {
  const raw = str(s);
  if (!raw) return "";
  try {
    const bin = atob(raw);
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  } catch {
    return raw;
  }
}

/** "Nome do Filme (2021)" → { title: "Nome do Filme", year: 2021 } */
export function splitYear(name: string): { title: string; year: number | null } {
  const m = name.match(/^(.*?)[\s\-–]*[([](\d{4})[)\]]\s*$/);
  if (m && m[1].trim()) return { title: m[1].trim(), year: Number(m[2]) };
  return { title: name.trim(), year: null };
}

const yearOf = (...vals: unknown[]): number | null => {
  for (const v of vals) {
    const m = str(v).match(/(19|20)\d{2}/);
    if (m) return Number(m[0]);
  }
  return null;
};

const ratingOf = (r: unknown, r5: unknown) => {
  const ten = toNum(r);
  if (ten !== null && ten > 0) return Math.min(10, ten);
  const five = toNum(r5);
  return five !== null && five > 0 ? Math.min(10, five * 2) : 0;
};

const categoriesOf = (one: unknown, many: unknown[] | undefined) => {
  const ids = (many ?? []).map(toNum).filter((n): n is number => n !== null);
  const single = toNum(one);
  if (single !== null && !ids.includes(single)) ids.unshift(single);
  return ids;
};

/** ID do YouTube a partir de "dQw4w9WgXcQ" ou de uma URL. */
export function youtubeKey(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** "01:45:00" | "105 min" | segundos → minutos */
function minutesOf(secs: unknown, text: unknown): number | null {
  const s = toNum(secs);
  if (s && s > 0) return Math.round(s / 60);
  const t = str(text);
  const hms = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (hms) return Number(hms[1]) * 60 + Number(hms[2]);
  const n = toNum(t.replace(/\D+$/, ""));
  return n && n > 0 ? Math.round(n) : null;
}

// ---------- Catálogo ----------

export const toGenres = (cats: XtCategory[] | null | undefined): Genre[] =>
  (cats ?? [])
    .map(c => ({ id: toNum(c.category_id) ?? -1, name: str(c.category_name) || "Sem categoria" }))
    .filter(g => g.id >= 0);

export function vodToSummary(v: XtVodStream): TitleSummary | null {
  const id = toNum(v.stream_id);
  if (id === null) return null;
  const { title, year } = splitYear(str(v.name));
  return {
    key: `movie:${id}`,
    id,
    type: "movie",
    title: title || "Sem título",
    originalTitle: title,
    overview: str(v.plot),
    year: year ?? yearOf(v.year),
    rating: ratingOf(v.rating, v.rating_5based),
    voteCount: 0,
    genreIds: categoriesOf(v.category_id, v.category_ids),
    poster: url(v.stream_icon),
    backdrop: null,
    popularity: toNum(v.added) ?? 0, // "adicionado em": ordena por novidade
  };
}

export function seriesToSummary(s: XtSeries): TitleSummary | null {
  const id = toNum(s.series_id);
  if (id === null) return null;
  const { title, year } = splitYear(str(s.name));
  return {
    key: `tv:${id}`,
    id,
    type: "tv",
    title: title || "Sem título",
    originalTitle: title,
    overview: str(s.plot),
    year: year ?? yearOf(s.year, s.releaseDate, s.release_date),
    rating: ratingOf(s.rating, s.rating_5based),
    voteCount: 0,
    genreIds: categoriesOf(s.category_id, s.category_ids),
    poster: url(s.cover),
    backdrop: firstUrl(s.backdrop_path),
    popularity: toNum(s.last_modified) ?? 0,
  };
}

export const toSummaries = <T>(items: T[] | null | undefined, fn: (x: T) => TitleSummary | null) => {
  const out: TitleSummary[] = [];
  for (const x of Array.isArray(items) ? items : []) {
    const s = fn(x);
    if (s) out.push(s);
  }
  return out;
};

export function liveToChannel(l: XtLiveStream): LiveChannel | null {
  const id = toNum(l.stream_id);
  if (id === null) return null;
  return {
    key: `live:${id}`,
    id,
    name: str(l.name) || `Canal ${id}`,
    logo: url(l.stream_icon),
    categoryIds: categoriesOf(l.category_id, l.category_ids),
    epgId: str(l.epg_channel_id) || null,
    archive: Number(l.tv_archive) === 1,
    archiveDays: toNum(l.tv_archive_duration) ?? 0,
    num: toNum(l.num) ?? 0,
  };
}

// ---------- Detalhes ----------

const base = (summary: TitleSummary): Omit<TitleDetails, "type"> => ({
  ...summary,
  genres: [],
  tagline: null,
  runtime: null,
  certification: null,
  logo: null,
  trailer: null,
  cast: [],
  creators: [],
  imdbId: null,
  providersBR: [],
  providersLink: null,
  recommendations: [],
});

const textGenres = (s: unknown): Genre[] => list(s).map((name, i) => ({ id: -(i + 1), name }));
const textCast = (s: unknown) => list(s).slice(0, 20).map((name, i) => ({ id: i, name, character: "", profile: null }));

export function vodInfoToDetails(id: number, raw: XtVodInfo | null, fallback?: TitleSummary): TitleDetails {
  const info = objOrEmpty(raw?.info);
  const data = raw?.movie_data;
  const name = str(info.name) || str(data?.name) || fallback?.title || "";
  const { title, year } = splitYear(name);
  const summary: TitleSummary = {
    key: `movie:${id}`,
    id,
    type: "movie",
    title: title || "Sem título",
    originalTitle: str(info.o_name) || title,
    overview: str(info.plot) || str(info.description) || fallback?.overview || "",
    year: year ?? yearOf(info.releasedate, info.release_date) ?? fallback?.year ?? null,
    rating: ratingOf(info.rating, null) || fallback?.rating || 0,
    voteCount: 0,
    genreIds: fallback?.genreIds ?? categoriesOf(data?.category_id, undefined),
    poster: url(info.movie_image) ?? url(info.cover_big) ?? fallback?.poster ?? null,
    backdrop: firstUrl(info.backdrop_path) ?? fallback?.backdrop ?? null,
    popularity: toNum(data?.added) ?? fallback?.popularity ?? 0,
  };
  const trailer = youtubeKey(info.youtube_trailer);
  return {
    ...base(summary),
    type: "movie",
    genres: textGenres(info.genre),
    runtime: minutesOf(info.duration_secs, info.duration),
    certification: str(info.mpaa_rating) || str(info.age) || null,
    trailer: trailer ? { key: trailer, name: "Trailer" } : null,
    cast: textCast(info.cast || info.actors),
    creators: list(info.director),
    container: str(data?.container_extension) || null,
  };
}

/** Temporadas a partir dos episódios (alguns painéis mandam `seasons` vazio ou incompleto). */
export function seasonsOf(raw: XtSeriesInfo | null): Season[] {
  const eps = raw?.episodes;
  const byNum = new Map<number, number>();
  if (eps && !Array.isArray(eps)) {
    for (const [k, arr] of Object.entries(eps)) {
      const n = toNum(k) ?? toNum(arr?.[0]?.season);
      if (n !== null && Array.isArray(arr) && arr.length > 0) byNum.set(n, arr.length);
    }
  } else if (Array.isArray(eps)) {
    eps.forEach((arr, i) => {
      if (!Array.isArray(arr) || arr.length === 0) return;
      const n = toNum(arr[0]?.season) ?? i + 1;
      byNum.set(n, arr.length);
    });
  }
  const meta = new Map((raw?.seasons ?? []).map(s => [toNum(s.season_number), s]));
  return [...byNum.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([number, count]) => {
      const m = meta.get(number);
      return {
        number,
        name: str(m?.name) || `Temporada ${number}`,
        episodeCount: count,
        poster: url(m?.cover_big) ?? url(m?.cover),
        airDate: str(m?.air_date) || null,
      };
    });
}

function rawEpisodes(raw: XtSeriesInfo | null, season: number): XtEpisode[] {
  const eps = raw?.episodes;
  if (!eps) return [];
  if (Array.isArray(eps)) return eps.find(arr => Array.isArray(arr) && toNum(arr[0]?.season) === season) ?? [];
  return eps[String(season)] ?? Object.values(eps).find(arr => toNum(arr?.[0]?.season) === season) ?? [];
}

export function episodesOf(seriesId: number, raw: XtSeriesInfo | null, season: number): Episode[] {
  const out: Episode[] = [];
  rawEpisodes(raw, season).forEach((e, i) => {
    const info = objOrEmpty(e.info);
    const n = toNum(e.episode_num) ?? i + 1;
    out.push({
      key: `tv:${seriesId}:s${season}e${n}`,
      season,
      episode: n,
      title: str(e.title) || str(info.name) || `Episódio ${n}`,
      overview: str(info.plot),
      still: url(info.movie_image),
      runtime: minutesOf(info.duration_secs, info.duration),
      airDate: str(info.releasedate) || null,
      streamId: str(e.id),
      container: str(e.container_extension) || "mp4",
    });
  });
  // Remove números repetidos (painéis duplicam episódios em qualidades diferentes)
  const seen = new Set<number>();
  return out.sort((a, b) => a.episode - b.episode).filter(e => (seen.has(e.episode) ? false : (seen.add(e.episode), true)));
}

export function seriesInfoToDetails(id: number, raw: XtSeriesInfo | null, fallback?: TitleSummary): TitleDetails {
  const info = objOrEmpty(raw?.info) as Partial<XtSeries>;
  const fromInfo = seriesToSummary({ ...info, name: str(info.name) || fallback?.title || "", series_id: id } as XtSeries);
  const summary: TitleSummary = {
    ...(fromInfo ?? fallback!),
    overview: fromInfo?.overview || fallback?.overview || "",
    poster: fromInfo?.poster ?? fallback?.poster ?? null,
    backdrop: fromInfo?.backdrop ?? fallback?.backdrop ?? null,
    genreIds: fallback?.genreIds?.length ? fallback.genreIds : fromInfo?.genreIds ?? [],
    year: fromInfo?.year ?? fallback?.year ?? null,
    rating: fromInfo?.rating || fallback?.rating || 0,
  };
  const trailer = youtubeKey(info.youtube_trailer);
  return {
    ...base(summary),
    type: "tv",
    genres: textGenres(info.genre),
    runtime: minutesOf(null, info.episode_run_time),
    trailer: trailer ? { key: trailer, name: "Trailer" } : null,
    cast: textCast(info.cast),
    creators: list(info.director),
    seasons: seasonsOf(raw),
    lastAirDate: null,
  };
}

// ---------- EPG ----------

export function epgOf(listings: XtEpgListing[] | null | undefined): EpgEntry[] {
  const out: EpgEntry[] = [];
  for (const l of listings ?? []) {
    const start = (toNum(l.start_timestamp) ?? 0) * 1000 || Date.parse(str(l.start).replace(" ", "T"));
    const end = (toNum(l.stop_timestamp) ?? 0) * 1000 || Date.parse(str(l.end).replace(" ", "T"));
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    out.push({ title: b64(l.title) || "Programação", description: b64(l.description), start, end });
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Programa no ar e o próximo. */
export function nowNext(epg: EpgEntry[], now = Date.now()) {
  const i = epg.findIndex(e => e.start <= now && e.end > now);
  if (i >= 0) return { now: epg[i], next: epg[i + 1] ?? null };
  return { now: null, next: epg.find(e => e.start > now) ?? null };
}
