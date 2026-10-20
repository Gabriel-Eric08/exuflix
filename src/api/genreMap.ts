import type { DiscoverFilters, MediaType } from "./types";

/** Gêneros unificados: o TMDB usa ids diferentes para filme e série em alguns casos. */
export interface UnifiedGenre {
  slug: string;
  name: string;
  movie?: number;
  tv?: number;
}

export const GENRES: UnifiedGenre[] = [
  { slug: "acao", name: "Ação", movie: 28, tv: 10759 },
  { slug: "aventura", name: "Aventura", movie: 12, tv: 10759 },
  { slug: "animacao", name: "Animação", movie: 16, tv: 16 },
  { slug: "comedia", name: "Comédia", movie: 35, tv: 35 },
  { slug: "crime", name: "Crime", movie: 80, tv: 80 },
  { slug: "documentario", name: "Documentário", movie: 99, tv: 99 },
  { slug: "drama", name: "Drama", movie: 18, tv: 18 },
  { slug: "familia", name: "Família", movie: 10751, tv: 10751 },
  { slug: "fantasia", name: "Fantasia", movie: 14, tv: 10765 },
  { slug: "ficcao-cientifica", name: "Ficção científica", movie: 878, tv: 10765 },
  { slug: "terror", name: "Terror", movie: 27 },
  { slug: "suspense", name: "Suspense", movie: 53 },
  { slug: "misterio", name: "Mistério", movie: 9648, tv: 9648 },
  { slug: "romance", name: "Romance", movie: 10749 },
  { slug: "historia", name: "História", movie: 36 },
  { slug: "guerra", name: "Guerra", movie: 10752, tv: 10768 },
  { slug: "faroeste", name: "Faroeste", movie: 37, tv: 37 },
  { slug: "musica", name: "Música", movie: 10402 },
  { slug: "infantil", name: "Infantil", tv: 10762 },
  { slug: "reality", name: "Reality", tv: 10764 },
  { slug: "novela", name: "Novela", tv: 10766 },
];

export const genreBySlug = (slug: string) => GENRES.find(g => g.slug === slug);

/** Acha o gênero unificado a partir do id de um tipo. */
export const genreById = (type: MediaType, id: number) => GENRES.find(g => g[type] === id);

/** Ordem dos gêneros nas linhas das abas (mais populares primeiro). */
export const ROW_ORDER: Record<MediaType, string[]> = {
  movie: ["acao", "comedia", "drama", "terror", "ficcao-cientifica", "animacao", "romance", "suspense", "crime", "fantasia", "documentario", "familia"],
  tv: ["drama", "comedia", "crime", "ficcao-cientifica", "acao", "animacao", "misterio", "documentario", "reality", "familia", "infantil", "novela"],
};

export interface Collection {
  slug: string;
  name: string;
  type: MediaType;
  filters: DiscoverFilters;
}

export const COLLECTIONS: Collection[] = [
  { slug: "brasileiros", name: "Brasileiros", type: "movie", filters: { lang: "pt", extra: { region: "BR" } } },
  { slug: "animes", name: "Animes", type: "tv", filters: { genreId: 16, lang: "ja" } },
  {
    slug: "classicos",
    name: "Clássicos",
    type: "movie",
    filters: { sortBy: "vote_average.desc", extra: { "primary_release_date.lte": "1980-12-31" } },
  },
  { slug: "curtos", name: "Curtos", type: "movie", filters: { extra: { "with_runtime.lte": 95, "with_runtime.gte": 40 } } },
];
