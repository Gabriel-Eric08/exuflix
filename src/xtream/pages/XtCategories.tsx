import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import type { Genre, MediaType, TitleSummary } from "../../api/types";
import { slugType, typeSlug, XT_BASE } from "../../app/routes";
import { Hero } from "../../components/Hero";
import { InfiniteGrid } from "../../components/InfiniteGrid";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useXtCategories, useXtLive, useXtTitles } from "../queries";
import { XtError, inCategory, sortTitles, useXtHero } from "./shared";
import styles from "../../pages/Categories.module.css";
import genreStyles from "../../pages/Genre.module.css";

/** Primeiro título (mais recente) de cada categoria, numa passada só. */
function coversOf(items: TitleSummary[]) {
  const m = new Map<number, { image: string | null; count: number }>();
  for (const t of sortTitles(items, "recentes")) {
    for (const id of t.genreIds) {
      const cur = m.get(id);
      if (cur) {
        cur.count++;
        if (!cur.image) cur.image = t.backdrop ?? t.poster;
      } else m.set(id, { image: t.backdrop ?? t.poster, count: 1 });
    }
  }
  return m;
}

export default function XtCategories() {
  useDocumentTitle("Categorias");
  const movies = useXtTitles("movie");
  const series = useXtTitles("tv");
  const live = useXtLive();
  const { data: movieCats } = useXtCategories("vod");
  const { data: seriesCats } = useXtCategories("series");
  const { data: liveCats } = useXtCategories("live");

  const movieCovers = useMemo(() => coversOf(movies.data ?? []), [movies.data]);
  const seriesCovers = useMemo(() => coversOf(series.data ?? []), [series.data]);
  const liveCounts = useMemo(() => {
    const m = new Map<number, number>();
    for (const c of live.data ?? []) for (const id of c.categoryIds) m.set(id, (m.get(id) ?? 0) + 1);
    return m;
  }, [live.data]);

  if (movies.isError && series.isError) return <main><XtError error={movies.error} onRetry={() => { movies.refetch(); series.refetch(); }} /></main>;

  return (
    <main className="page">
      <h1 className="page-title">Categorias</h1>
      <Section title="Filmes" type="movie" cats={movieCats} covers={movieCovers} />
      <Section title="Séries" type="tv" cats={seriesCats} covers={seriesCovers} />
      {(liveCats ?? []).some(c => liveCounts.has(c.id)) && (
        <>
          <h2 className={styles.h2}>Canais ao vivo</h2>
          <div className={styles.grid}>
            {(liveCats ?? []).filter(c => liveCounts.has(c.id)).map((c, i) => (
              <Link key={c.id} to={`${XT_BASE}/ao-vivo?categoria=${c.id}`} className={`${styles.card} ${i % 2 ? styles.gold : ""}`} style={{ aspectRatio: "16 / 6" }}>
                <span className={styles.scrim} />
                <span className={styles.name}>
                  {c.name} <small style={{ color: "var(--text-3)", fontWeight: 600 }}>· {liveCounts.get(c.id)}</small>
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function Section({
  title,
  type,
  cats,
  covers,
}: {
  title: string;
  type: MediaType;
  cats: Genre[] | undefined;
  covers: Map<number, { image: string | null; count: number }>;
}) {
  const used = (cats ?? []).filter(c => covers.has(c.id));
  if (used.length === 0) return null;
  return (
    <>
      <h2 className={styles.h2}>{title}</h2>
      <div className={styles.grid}>
        {used.map((c, i) => {
          const cover = covers.get(c.id)!;
          return (
            <Link key={c.id} to={`${XT_BASE}/categorias/${typeSlug(type)}/${c.id}`} className={`${styles.card} ${i % 2 ? styles.gold : ""}`}>
              {cover.image && <img src={cover.image} alt="" loading="lazy" decoding="async" onError={e => (e.currentTarget.style.display = "none")} />}
              <span className={styles.scrim} />
              <span className={styles.name}>{c.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

/** /pai-marcondes/categorias/:tipo/:id */
export function XtGenre() {
  const { tipo, id: idStr } = useParams();
  const type = slugType(tipo);
  const id = Number(idStr);
  const q = useXtTitles(type ?? "movie", !!type);
  const { data: cats } = useXtCategories(type === "tv" ? "series" : "vod");
  const items = useMemo(() => sortTitles(inCategory(q.data ?? [], id), "recentes"), [q.data, id]);
  const name = cats?.find(c => c.id === id)?.name ?? "Categoria";
  useDocumentTitle(name);
  const hero = useXtHero(items, 1);

  if (!type || !Number.isFinite(id)) return <Navigate to={`${XT_BASE}/categorias`} replace />;
  if (q.isError) return <main><XtError error={q.error} onRetry={() => q.refetch()} /></main>;

  return (
    <main>
      <Hero items={hero.items} loading={q.isLoading || hero.loading} />
      <div className={genreStyles.head}>
        <h1 className={genreStyles.title}>{name}</h1>
        <span className="meta">{q.data ? `${items.length} título${items.length === 1 ? "" : "s"}` : null}</span>
      </div>
      <InfiniteGrid items={items} isLoading={q.isLoading} isError={q.isError} onRetry={() => q.refetch()} requirePoster={false} />
    </main>
  );
}
