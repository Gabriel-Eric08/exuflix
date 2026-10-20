import { describe, expect, it } from "vitest";
import { pickLogo, pickTrailer, toDetails, toEpisodes, toSummaries, toSummary } from "../api/normalize";
import type { TmdbMovieDetails, TmdbTvDetails } from "../api/types";

describe("toSummary", () => {
  it("normaliza um filme", () => {
    const s = toSummary({
      id: 550,
      media_type: "movie",
      title: "Clube da Luta",
      original_title: "Fight Club",
      release_date: "1999-10-15",
      vote_average: 8.437,
      vote_count: 30000,
      genre_ids: [18],
      poster_path: "/p.jpg",
      backdrop_path: "/b.jpg",
      popularity: 80,
    });
    expect(s).toEqual({
      key: "movie:550",
      id: 550,
      type: "movie",
      title: "Clube da Luta",
      originalTitle: "Fight Club",
      overview: "",
      year: 1999,
      rating: 8.4,
      voteCount: 30000,
      genreIds: [18],
      poster: "/p.jpg",
      backdrop: "/b.jpg",
      popularity: 80,
    });
  });

  it("usa o tipo de fallback e os campos de série", () => {
    const s = toSummary({ id: 1399, name: "GoT", original_name: "Game of Thrones", first_air_date: "2011-04-17" }, "tv");
    expect(s?.key).toBe("tv:1399");
    expect(s?.title).toBe("GoT");
    expect(s?.year).toBe(2011);
    expect(s?.poster).toBeNull();
  });

  it("descarta pessoas da busca multi", () => {
    expect(toSummary({ id: 1, media_type: "person", name: "Alguém" })).toBeNull();
    expect(toSummaries([{ id: 1, media_type: "person" }, { id: 2, media_type: "movie", title: "X" }])).toHaveLength(1);
  });

  it("ano nulo sem data", () => {
    expect(toSummary({ id: 1, media_type: "movie", title: "X", release_date: "" })?.year).toBeNull();
  });
});

describe("pickTrailer / pickLogo", () => {
  const v = (o: Partial<{ key: string; type: string; official: boolean; iso_639_1: string; site: string }>) => ({
    key: "k",
    name: "n",
    site: "YouTube",
    type: "Trailer",
    official: false,
    iso_639_1: "en",
    ...o,
  });

  it("prefere trailer oficial em português", () => {
    const t = pickTrailer({ results: [v({ key: "en", official: true }), v({ key: "pt", official: true, iso_639_1: "pt" })] });
    expect(t?.key).toBe("pt");
  });

  it("cai para teaser e ignora outros sites", () => {
    expect(pickTrailer({ results: [v({ key: "vimeo", site: "Vimeo" }), v({ key: "teaser", type: "Teaser" })] })?.key).toBe("teaser");
    expect(pickTrailer({ results: [] })).toBeNull();
  });

  it("logo em pt, senão en, senão o primeiro", () => {
    expect(pickLogo({ logos: [{ file_path: "/en", iso_639_1: "en" }, { file_path: "/pt", iso_639_1: "pt" }] })).toBe("/pt");
    expect(pickLogo({ logos: [{ file_path: "/x", iso_639_1: null }, { file_path: "/en", iso_639_1: "en" }] })).toBe("/en");
    expect(pickLogo({ logos: [{ file_path: "/x", iso_639_1: "fr" }] })).toBe("/x");
    expect(pickLogo(undefined)).toBeNull();
  });
});

describe("toDetails", () => {
  it("filme: classificação BR, direção e provedores", () => {
    const raw: TmdbMovieDetails = {
      id: 10378,
      title: "Big Buck Bunny",
      original_title: "Big Buck Bunny",
      release_date: "2008-05-30",
      genres: [{ id: 16, name: "Animação" }],
      runtime: 10,
      credits: { cast: [{ id: 1, name: "Coelho", character: "Ele mesmo", profile_path: null }], crew: [{ id: 2, name: "Sacha", job: "Director" }, { id: 3, name: "Outro", job: "Writer" }] },
      release_dates: { results: [{ iso_3166_1: "US", release_dates: [{ certification: "G", type: 3 }] }, { iso_3166_1: "BR", release_dates: [{ certification: "", type: 1 }, { certification: "L", type: 3 }] }] },
      "watch/providers": { results: { BR: { link: "https://x", flatrate: [{ provider_id: 8, provider_name: "Netflix", logo_path: "/n.png" }] } } },
      recommendations: { page: 1, results: [{ id: 45745, title: "Sintel" }], total_pages: 1, total_results: 1 },
    };
    const d = toDetails(raw, "movie");
    expect(d.certification).toBe("L");
    expect(d.creators).toEqual(["Sacha"]);
    expect(d.runtime).toBe(10);
    expect(d.genreIds).toEqual([16]);
    expect(d.providersBR).toEqual([{ id: 8, name: "Netflix", logo: "/n.png" }]);
    expect(d.recommendations[0].key).toBe("movie:45745");
    expect(d.seasons).toBeUndefined();
  });

  it("série: oculta a temporada 0 e lê o personagem de roles", () => {
    const raw: TmdbTvDetails = {
      id: 1,
      name: "Série",
      genres: [],
      episode_run_time: [42],
      created_by: [{ id: 9, name: "Criadora" }],
      aggregate_credits: { cast: [{ id: 1, name: "Atriz", roles: [{ character: "Heroína" }], profile_path: null }], crew: [] },
      content_ratings: { results: [{ iso_3166_1: "BR", rating: "14" }] },
      seasons: [
        { season_number: 0, name: "Especiais", episode_count: 3, poster_path: null, air_date: null },
        { season_number: 1, name: "Temporada 1", episode_count: 8, poster_path: null, air_date: "2020-01-01" },
      ],
      status: "Ended",
      last_episode_to_air: { air_date: "2020-03-01" },
    };
    const d = toDetails(raw, "tv");
    expect(d.seasons).toEqual([{ number: 1, name: "Temporada 1", episodeCount: 8, poster: null, airDate: "2020-01-01" }]);
    expect(d.cast[0].character).toBe("Heroína");
    expect(d.certification).toBe("14");
    expect(d.runtime).toBe(42);
    expect(d.creators).toEqual(["Criadora"]);
    expect(d.lastAirDate).toBe("2020-03-01");
  });
});

describe("toEpisodes", () => {
  it("gera chaves por episódio", () => {
    const eps = toEpisodes(7, {
      season_number: 2,
      episodes: [{ season_number: 2, episode_number: 5, name: "O Cruzamento", overview: "", still_path: "/s.jpg", runtime: 50, air_date: null }],
    });
    expect(eps[0]).toMatchObject({ key: "tv:7:s2e5", season: 2, episode: 5, title: "O Cruzamento", still: "/s.jpg" });
  });
});
