import { XT_BASE } from "../../app/routes";
import { Hero } from "../../components/Hero";
import { ContinueWatchingRow } from "../../components/PersonalRows";
import { SkeletonRow } from "../../components/Row";
import { WatchlistRow } from "../../components/WatchlistRow";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useXtCategories, useXtTitles } from "../queries";
import { LiveRow } from "./LiveTV";
import { XtError, XtRow, inCategory, sortTitles, usedCategories, useXtHero } from "./shared";

const MOVIE_CATEGORY_ROWS = 14;
const SERIES_CATEGORY_ROWS = 8;

export default function XtHome() {
  useDocumentTitle("Marcondes de Oxóssi");
  const movies = useXtTitles("movie");
  const series = useXtTitles("tv");
  const { data: movieCats } = useXtCategories("vod");
  const { data: seriesCats } = useXtCategories("series");

  const recentMovies = sortTitles(movies.data ?? [], "recentes");
  const recentSeries = sortTitles(series.data ?? [], "recentes");
  const movieCatIds = usedCategories(recentMovies);
  const seriesCatIds = usedCategories(recentSeries);
  const hero = useXtHero([...recentMovies.slice(0, 5), ...recentSeries.filter(t => t.backdrop).slice(0, 5)]);

  if (movies.isError && series.isError) {
    return (
      <main>
        <XtError error={movies.error} onRetry={() => { movies.refetch(); series.refetch(); }} />
      </main>
    );
  }

  const loading = movies.isLoading || series.isLoading;

  return (
    <main>
      <Hero items={hero.items} loading={loading || hero.loading} />
      <ContinueWatchingRow />
      <WatchlistRow />
      {loading ? (
        <>
          <SkeletonRow title="Adicionados recentemente" />
          <SkeletonRow title="Séries" />
        </>
      ) : (
        <>
          <XtRow title="Filmes adicionados recentemente" items={recentMovies} seeAllHref={`${XT_BASE}/filmes?ordem=recentes`} />
          <XtRow title="Séries atualizadas recentemente" items={recentSeries} seeAllHref={`${XT_BASE}/series?ordem=recentes`} />
          <LiveRow />
          <XtRow title="Filmes mais bem avaliados" items={sortTitles(movies.data ?? [], "avaliados")} seeAllHref={`${XT_BASE}/filmes?ordem=avaliados`} />
          {(movieCats ?? [])
            .filter(c => movieCatIds.has(c.id))
            .slice(0, MOVIE_CATEGORY_ROWS)
            .map(c => ({ c, items: inCategory(recentMovies, c.id) }))
            .map(({ c, items }) => (
              <XtRow key={`m${c.id}`} title={c.name} items={items} seeAllHref={`${XT_BASE}/categorias/filme/${c.id}`} />
            ))}
          {(seriesCats ?? [])
            .filter(c => seriesCatIds.has(c.id))
            .slice(0, SERIES_CATEGORY_ROWS)
            .map(c => ({ c, items: inCategory(recentSeries, c.id) }))
            .map(({ c, items }) => (
              <XtRow key={`s${c.id}`} title={`Séries · ${c.name}`} items={items} seeAllHref={`${XT_BASE}/categorias/serie/${c.id}`} />
            ))}
        </>
      )}
    </main>
  );
}
