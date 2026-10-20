import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/endpoints";
import { COLLECTIONS, GENRES, type UnifiedGenre, type Collection } from "../api/genreMap";
import { img } from "../api/images";
import type { DiscoverFilters, MediaType } from "../api/types";
import { useInView } from "../hooks/useInView";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { typeSlug } from "../app/routes";
import styles from "./Categories.module.css";

/** Backdrop do título mais popular do gênero (cache de 24 h). */
function useCover(type: MediaType, filters: DiscoverFilters, enabled: boolean) {
  return useQuery({
    queryKey: ["cover", type, filters],
    queryFn: async () => (await api.discover(type, filters)).results.find(r => r.backdrop_path)?.backdrop_path ?? null,
    staleTime: 24 * 60 * 60 * 1000,
    enabled,
  });
}

export default function Categories() {
  useDocumentTitle("Categorias");
  return (
    <main className="page">
      <h1 className="page-title">Categorias</h1>

      <h2 className={styles.h2}>Coleções especiais</h2>
      <div className={styles.grid}>
        {COLLECTIONS.map((c, i) => (
          <CollectionCard key={c.slug} c={c} accent={i % 2 === 0 ? "red" : "gold"} />
        ))}
      </div>

      <h2 className={styles.h2}>Gêneros</h2>
      <div className={styles.grid}>
        {GENRES.map((g, i) => (
          <GenreCard key={g.slug} g={g} accent={i % 2 === 0 ? "red" : "gold"} />
        ))}
      </div>
    </main>
  );
}

function GenreCard({ g, accent }: { g: UnifiedGenre; accent: "red" | "gold" }) {
  const type: MediaType = g.movie ? "movie" : "tv";
  const id = g[type]!;
  return <Card to={`/categorias/${typeSlug(type)}/${id}-${g.slug}`} name={g.name} type={type} filters={{ genreId: id }} accent={accent} />;
}

function CollectionCard({ c, accent }: { c: Collection; accent: "red" | "gold" }) {
  return <Card to={`/categorias/colecao/${c.slug}`} name={c.name} type={c.type} filters={c.filters} accent={accent} />;
}

function Card({ to, name, type, filters, accent }: { to: string; name: string; type: MediaType; filters: DiscoverFilters; accent: "red" | "gold" }) {
  const [ref, inView] = useInView<HTMLAnchorElement>("200px");
  const { data: cover } = useCover(type, filters, inView);
  return (
    <Link ref={ref} to={to} className={`${styles.card} ${styles[accent]}`}>
      {cover && <img src={img(cover, "w780")!} alt="" loading="lazy" decoding="async" />}
      <span className={styles.scrim} />
      <span className={styles.name}>{name}</span>
    </Link>
  );
}
