import type * as T from "./types";

const yearOf = (d?: string) => (d ? Number(d.slice(0, 4)) || null : null);

export function toSummary(raw: T.TmdbListItem, fallbackType?: T.MediaType): T.TitleSummary | null {
  const type = (raw.media_type ?? fallbackType) as T.MediaType;
  if (type !== "movie" && type !== "tv") return null; // ignora "person" na busca multi
  return {
    key: `${type}:${raw.id}`,
    id: raw.id,
    type,
    title: (type === "movie" ? raw.title : raw.name) ?? "",
    originalTitle: (type === "movie" ? raw.original_title : raw.original_name) ?? "",
    overview: raw.overview ?? "",
    year: yearOf(type === "movie" ? raw.release_date : raw.first_air_date),
    rating: Math.round((raw.vote_average ?? 0) * 10) / 10,
    voteCount: raw.vote_count ?? 0,
    genreIds: raw.genre_ids ?? [],
    poster: raw.poster_path ?? null,
    backdrop: raw.backdrop_path ?? null,
    popularity: raw.popularity ?? 0,
  };
}

export const toSummaries = (items: T.TmdbListItem[], type?: T.MediaType) =>
  items.map(i => toSummary(i, type)).filter((x): x is T.TitleSummary => !!x);

export function pickTrailer(videos?: T.TmdbVideos) {
  const yt = videos?.results.filter(v => v.site === "YouTube") ?? [];
  const best =
    yt.find(v => v.type === "Trailer" && v.iso_639_1 === "pt" && v.official) ??
    yt.find(v => v.type === "Trailer" && v.official) ??
    yt.find(v => v.type === "Trailer") ??
    yt.find(v => v.type === "Teaser");
  return best ? { key: best.key, name: best.name } : null;
}

export function pickLogo(images?: T.TmdbImages) {
  const logos = images?.logos ?? [];
  return (logos.find(l => l.iso_639_1 === "pt") ?? logos.find(l => l.iso_639_1 === "en") ?? logos[0])?.file_path ?? null;
}

function certMovie(rd?: T.TmdbReleaseDates) {
  const br = rd?.results.find(r => r.iso_3166_1 === "BR");
  return br?.release_dates.find(d => d.certification)?.certification || null;
}

function certTv(cr?: T.TmdbContentRatings) {
  return cr?.results.find(r => r.iso_3166_1 === "BR")?.rating || null;
}

export function toDetails(raw: T.TmdbMovieDetails | T.TmdbTvDetails, type: T.MediaType): T.TitleDetails {
  const base = toSummary({ ...raw, media_type: type, genre_ids: raw.genres.map(g => g.id) })!;
  const isMovie = type === "movie";
  const m = raw as T.TmdbMovieDetails;
  const t = raw as T.TmdbTvDetails;
  const credits = isMovie ? m.credits : t.aggregate_credits;
  const br = raw["watch/providers"]?.results?.BR;

  return {
    ...base,
    genres: raw.genres,
    tagline: raw.tagline || null,
    runtime: isMovie ? m.runtime ?? null : t.episode_run_time?.[0] ?? null,
    certification: isMovie ? certMovie(m.release_dates) : certTv(t.content_ratings),
    logo: pickLogo(raw.images),
    trailer: pickTrailer(raw.videos),
    cast: (credits?.cast ?? []).slice(0, 12).map(c => ({
      id: c.id,
      name: c.name,
      character: c.character ?? c.roles?.[0]?.character ?? "",
      profile: c.profile_path ?? null,
    })),
    creators: isMovie
      ? (m.credits?.crew ?? []).filter(c => c.job === "Director").map(c => c.name)
      : (t.created_by ?? []).map(c => c.name),
    imdbId: raw.external_ids?.imdb_id ?? null,
    providersBR: (br?.flatrate ?? []).map(p => ({ id: p.provider_id, name: p.provider_name, logo: p.logo_path })),
    providersLink: br?.link ?? null,
    recommendations: toSummaries(raw.recommendations?.results ?? [], type).slice(0, 12),
    ...(isMovie
      ? {}
      : {
          seasons: t.seasons
            .filter(s => s.season_number > 0)
            .map(s => ({
              number: s.season_number,
              name: s.name,
              episodeCount: s.episode_count,
              poster: s.poster_path,
              airDate: s.air_date,
            })),
          status: t.status,
          lastAirDate: t.last_episode_to_air?.air_date ?? null,
        }),
  };
}

export function toEpisodes(tvId: number, season: T.TmdbSeason): T.Episode[] {
  return season.episodes.map(e => ({
    key: `tv:${tvId}:s${e.season_number}e${e.episode_number}`,
    season: e.season_number,
    episode: e.episode_number,
    title: e.name,
    overview: e.overview,
    still: e.still_path,
    runtime: e.runtime,
    airDate: e.air_date,
  }));
}
