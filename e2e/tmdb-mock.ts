import type { Page, Route } from "@playwright/test";

/** Respostas mínimas do TMDB para os testes de ponta a ponta (sem token, sem rede para a API). */
const item = (id: number, type: "movie" | "tv", title: string, extra: Record<string, unknown> = {}) => ({
  id,
  media_type: type,
  ...(type === "movie" ? { title, original_title: title, release_date: "2008-05-30" } : { name: title, original_name: title, first_air_date: "2020-01-01" }),
  overview: `Sinopse de ${title}.`,
  vote_average: 7.5,
  vote_count: 1000,
  genre_ids: [16],
  poster_path: `/poster-${id}.jpg`,
  backdrop_path: `/backdrop-${id}.jpg`,
  popularity: 100,
  ...extra,
});

const MOVIES = [
  item(10378, "movie", "Big Buck Bunny"),
  item(45745, "movie", "Sintel"),
  item(1, "movie", "Filme Sem Fonte"),
];
const SHOWS = [item(500, "tv", "Série de Teste")];

const page = (results: unknown[]) => ({ page: 1, results, total_pages: 1, total_results: results.length });

function movieDetails(id: number) {
  const base = MOVIES.find(m => m.id === id);
  if (!base) return null;
  return {
    ...base,
    genres: [{ id: 16, name: "Animação" }],
    runtime: 10,
    tagline: "",
    videos: { results: [{ key: "YE7VzlLtp-4", name: "Trailer", site: "YouTube", type: "Trailer", official: true, iso_639_1: "en" }] },
    images: { logos: [] },
    credits: { cast: [{ id: 1, name: "Coelho", character: "Ele", profile_path: null }], crew: [{ id: 2, name: "Sacha Goedegebure", job: "Director" }] },
    release_dates: { results: [{ iso_3166_1: "BR", release_dates: [{ certification: "L", type: 3 }] }] },
    "watch/providers": { results: {} },
    recommendations: page(MOVIES.filter(m => m.id !== id)),
    external_ids: { imdb_id: null },
  };
}

export async function mockTmdb(page_: Page) {
  // Imagens: responde vazio (o app mostra o fallback com o título)
  await page_.route("https://image.tmdb.org/**", r => r.fulfill({ status: 404, body: "" }));
  await page_.route("https://fonts.googleapis.com/**", r => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page_.route("https://www.youtube-nocookie.com/**", r => r.fulfill({ status: 200, contentType: "text/html", body: "<html></html>" }));

  await page_.route("**/api/tmdb/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/tmdb/, "");
    const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (path.startsWith("/genre/")) return json({ genres: [{ id: 16, name: "Animação" }, { id: 28, name: "Ação" }] });
    if (path.startsWith("/trending/tv") || path.startsWith("/tv/on_the_air") || path.startsWith("/tv/airing_today") || path.startsWith("/tv/popular") || path.startsWith("/tv/top_rated") || path.startsWith("/discover/tv"))
      return json(page(SHOWS));
    if (path.startsWith("/trending/") || path.startsWith("/movie/now_playing") || path.startsWith("/movie/upcoming") || path.startsWith("/movie/popular") || path.startsWith("/movie/top_rated") || path.startsWith("/discover/movie") || path.startsWith("/search/"))
      return json(page(MOVIES));
    const m = path.match(/^\/movie\/(\d+)$/);
    if (m) {
      const d = movieDetails(Number(m[1]));
      return d ? json(d) : json({ status_message: "not found" }, 404);
    }
    return json({ status_message: "not found" }, 404);
  });
}
