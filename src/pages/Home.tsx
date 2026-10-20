import { api } from "../api/endpoints";
import { Hero } from "../components/Hero";
import { QueryRow } from "../components/Row";
import { WatchlistRow } from "../components/WatchlistRow";
import { useRow } from "../hooks/queries";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function Home() {
  useDocumentTitle(null);
  const hero = useRow(["trending", "all", "week"], () => api.trending("all", "week"));

  return (
    <main>
      <Hero items={hero.data ?? []} loading={hero.isLoading} />
      <QueryRow eager variant="top10" title="Top 10 no Brasil hoje" queryKey={["trending", "all", "day"]} fetcher={() => api.trending("all", "day")} />
      <WatchlistRow />
      <QueryRow eager title="Lançamentos nos cinemas" queryKey={["movie", "now_playing"]} fetcher={() => api.list("movie", "now_playing")} type="movie" seeAllHref="/filmes?ordem=lancamentos" />
      <QueryRow title="Séries em alta" queryKey={["trending", "tv", "week"]} fetcher={() => api.trending("tv", "week")} type="tv" seeAllHref="/series" />
      <QueryRow title="Filmes em alta" queryKey={["trending", "movie", "week"]} fetcher={() => api.trending("movie", "week")} type="movie" seeAllHref="/filmes" />
      <QueryRow title="Aclamados pela crítica" queryKey={["movie", "top_rated"]} fetcher={() => api.list("movie", "top_rated")} type="movie" seeAllHref="/filmes?ordem=avaliados" />
      <QueryRow title="Ação e aventura" queryKey={["discover", "movie", 28]} fetcher={() => api.discover("movie", { genreId: 28 })} type="movie" seeAllHref="/categorias/filme/28-acao" />
      <QueryRow title="Comédia" queryKey={["discover", "movie", 35]} fetcher={() => api.discover("movie", { genreId: 35 })} type="movie" seeAllHref="/categorias/filme/35-comedia" />
      <QueryRow title="Terror" queryKey={["discover", "movie", 27]} fetcher={() => api.discover("movie", { genreId: 27 })} type="movie" seeAllHref="/categorias/filme/27-terror" />
      <QueryRow title="Animação" queryKey={["discover", "movie", 16]} fetcher={() => api.discover("movie", { genreId: 16 })} type="movie" seeAllHref="/categorias/filme/16-animacao" />
      <QueryRow title="Produções brasileiras" queryKey={["discover", "movie", "pt"]} fetcher={() => api.discover("movie", { lang: "pt", extra: { region: "BR" } })} type="movie" seeAllHref="/categorias/colecao/brasileiros" />
      <QueryRow title="Documentários" queryKey={["discover", "movie", 99]} fetcher={() => api.discover("movie", { genreId: 99 })} type="movie" seeAllHref="/categorias/filme/99-documentario" />
    </main>
  );
}
