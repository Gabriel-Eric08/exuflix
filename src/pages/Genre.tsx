import { Link, Navigate, useParams } from "react-router-dom";
import { COLLECTIONS, genreById, type UnifiedGenre } from "../api/genreMap";
import type { DiscoverFilters, MediaType } from "../api/types";
import { useDiscover, useGenres } from "../hooks/queries";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { slugType, typeSlug } from "../app/routes";
import { Hero } from "../components/Hero";
import { InfiniteGrid } from "../components/InfiniteGrid";
import styles from "./Genre.module.css";

/** /categorias/:tipo/:genero — tipo = filme | serie | colecao; genero = "28-acao" ou slug da coleção. */
export default function Genre() {
  const { tipo, genero = "" } = useParams();

  if (tipo === "colecao") {
    const c = COLLECTIONS.find(x => x.slug === genero);
    if (!c) return <Navigate to="/categorias" replace />;
    return <GenreView name={c.name} type={c.type} filters={c.filters} />;
  }

  const type = slugType(tipo);
  const id = parseInt(genero, 10);
  if (!type || !Number.isFinite(id)) return <Navigate to="/categorias" replace />;
  return <GenreView name={null} type={type} filters={{ genreId: id }} unified={genreById(type, id)} id={id} />;
}

function GenreView({
  name,
  type,
  filters,
  unified,
  id,
}: {
  name: string | null;
  type: MediaType;
  filters: DiscoverFilters;
  unified?: UnifiedGenre;
  id?: number;
}) {
  const { data: genres } = useGenres(type);
  const title = name ?? unified?.name ?? genres?.find(g => g.id === id)?.name ?? "Categoria";
  useDocumentTitle(title);
  const q = useDiscover(type, filters);
  const other: MediaType = type === "movie" ? "tv" : "movie";
  const otherId = unified?.[other];

  return (
    <main>
      <Hero items={(q.data ?? []).slice(0, 1)} loading={q.isLoading} />
      <div className={styles.head}>
        <h1 className={styles.title}>{title}</h1>
        {unified && otherId && (
          <div className={styles.chips} role="group" aria-label="Tipo">
            {(["movie", "tv"] as const).map(t => (
              <Link
                key={t}
                to={`/categorias/${typeSlug(t)}/${unified[t]}-${unified.slug}`}
                replace
                className={`chip ${t === type ? "active" : ""}`}
                aria-current={t === type ? "page" : undefined}
              >
                {t === "movie" ? "Filmes" : "Séries"}
              </Link>
            ))}
          </div>
        )}
      </div>
      <InfiniteGrid
        items={q.data}
        isLoading={q.isLoading}
        isError={q.isError}
        hasNextPage={q.hasNextPage}
        isFetchingNextPage={q.isFetchingNextPage}
        fetchNextPage={q.fetchNextPage}
        onRetry={() => q.refetch()}
      />
    </main>
  );
}
