import { useSearchParams } from "react-router-dom";
import { Rows3, LayoutGrid } from "lucide-react";
import { api } from "../api/endpoints";
import { GENRES, ROW_ORDER, genreBySlug } from "../api/genreMap";
import type { MediaType } from "../api/types";
import { useDiscover, useGenres, useRow } from "../hooks/queries";
import { useInfiniteList } from "../hooks/useInfiniteList";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { typeSlug } from "../app/routes";
import { Hero } from "../components/Hero";
import { InfiniteGrid } from "../components/InfiniteGrid";
import { QueryRow } from "../components/Row";
import styles from "./Browse.module.css";

type Order = "populares" | "avaliados" | "lancamentos" | "exibicao";

const ORDERS: { value: Order; label: string }[] = [
  { value: "populares", label: "Populares" },
  { value: "avaliados", label: "Mais bem avaliados" },
  { value: "lancamentos", label: "Lançamentos" },
  { value: "exibicao", label: "Em exibição" },
];

const sortFor = (type: MediaType, order: Order) =>
  order === "avaliados"
    ? "vote_average.desc"
    : order === "lancamentos"
      ? type === "movie" ? "primary_release_date.desc" : "first_air_date.desc"
      : "popularity.desc";

const thisYear = new Date().getFullYear();
const YEARS = Array.from({ length: 60 }, (_, i) => thisYear - i);

export default function Browse({ type }: { type: MediaType }) {
  const [params, setParams] = useSearchParams();
  const label = type === "movie" ? "Filmes" : "Séries";
  useDocumentTitle(label);

  const genre = params.get("genero") ? Number(params.get("genero")) : undefined;
  const order = (params.get("ordem") as Order | null) ?? undefined;
  const year = params.get("ano") ? Number(params.get("ano")) : undefined;
  const filtered = genre !== undefined || order !== undefined || year !== undefined;
  const mode = params.get("modo") ?? (filtered ? "grade" : "linhas");

  const set = (k: string, v: string | number | undefined) =>
    setParams(
      prev => {
        const next = new URLSearchParams(prev);
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, String(v));
        if (k !== "modo" && v !== undefined) next.delete("modo");
        return next;
      },
      { replace: true },
    );

  const hero = useRow(["trending", type, "day"], () => api.trending(type, "day"), type);
  const { data: genres } = useGenres(type);

  return (
    <main>
      <Hero items={(hero.data ?? []).slice(0, 1)} loading={hero.isLoading} />

      <div className={styles.filters} role="toolbar" aria-label={`Filtros de ${label}`}>
        <h1 className={styles.heading}>{label}</h1>
        <select className="select" value={genre ?? ""} onChange={e => set("genero", e.target.value || undefined)} aria-label="Gêneros">
          <option value="">Gêneros</option>
          {(genres ?? []).map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <div className={styles.chips}>
          {ORDERS.map(o => (
            <button
              key={o.value}
              className="chip"
              aria-pressed={order === o.value}
              onClick={() => set("ordem", order === o.value ? undefined : o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <select className="select" value={year ?? ""} onChange={e => set("ano", e.target.value || undefined)} aria-label="Ano">
          <option value="">Ano</option>
          {YEARS.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <div className={styles.toggle} role="group" aria-label="Visualização">
          <button aria-pressed={mode === "linhas"} onClick={() => setParams(p => { const n = new URLSearchParams(p); n.set("modo", "linhas"); return n; }, { replace: true })} title="Linhas">
            <Rows3 size={18} /> <span>Linhas</span>
          </button>
          <button aria-pressed={mode === "grade"} onClick={() => set("modo", "grade")} title="Grade">
            <LayoutGrid size={18} /> <span>Grade</span>
          </button>
        </div>
      </div>

      {mode === "grade" ? (
        <BrowseGrid type={type} genre={genre} order={order ?? "populares"} year={year} />
      ) : (
        <BrowseRows type={type} />
      )}
    </main>
  );
}

function BrowseGrid({ type, genre, order, year }: { type: MediaType; genre?: number; order: Order; year?: number }) {
  const nowShowing = order === "exibicao";
  const discover = useDiscover(type, { genreId: genre, sortBy: sortFor(type, order), year }, !nowShowing);
  const list = useInfiniteList(type, type === "movie" ? "now_playing" : "on_the_air", nowShowing);
  const q = nowShowing ? list : discover;
  // "Em exibição" vem de uma lista fixa do TMDB: gênero e ano são filtrados aqui
  const items = nowShowing
    ? q.data?.filter(i => (genre === undefined || i.genreIds.includes(genre)) && (year === undefined || i.year === year))
    : q.data;

  return (
    <div className={styles.grid}>
      <InfiniteGrid
        items={items}
        isLoading={q.isLoading}
        isError={q.isError}
        hasNextPage={q.hasNextPage}
        isFetchingNextPage={q.isFetchingNextPage}
        fetchNextPage={q.fetchNextPage}
        onRetry={() => q.refetch()}
        empty={<p className="empty">Nenhum título com esses filtros. Tente outra combinação.</p>}
      />
    </div>
  );
}

function BrowseRows({ type }: { type: MediaType }) {
  const slug = typeSlug(type);
  return (
    <div className={styles.rows}>
      {type === "tv" ? (
        <>
          <QueryRow eager title="No ar esta semana" queryKey={["tv", "on_the_air"]} fetcher={() => api.list("tv", "on_the_air")} type="tv" seeAllHref="/series?ordem=exibicao" />
          <QueryRow eager title="Novos episódios hoje" queryKey={["tv", "airing_today"]} fetcher={() => api.list("tv", "airing_today")} type="tv" />
        </>
      ) : (
        <>
          <QueryRow eager title="Em cartaz" queryKey={["movie", "now_playing"]} fetcher={() => api.list("movie", "now_playing")} type="movie" seeAllHref="/filmes?ordem=exibicao" />
          <QueryRow eager title="Em breve nos cinemas" queryKey={["movie", "upcoming"]} fetcher={() => api.list("movie", "upcoming")} type="movie" />
        </>
      )}
      <QueryRow title="Populares" queryKey={[type, "popular"]} fetcher={() => api.list(type, "popular")} type={type} seeAllHref={`/${type === "movie" ? "filmes" : "series"}?ordem=populares`} />
      <QueryRow title="Mais bem avaliados" queryKey={[type, "top_rated"]} fetcher={() => api.list(type, "top_rated")} type={type} seeAllHref={`/${type === "movie" ? "filmes" : "series"}?ordem=avaliados`} />
      {ROW_ORDER[type].map(s => {
        const g = genreBySlug(s) ?? GENRES[0];
        const id = g[type]!;
        return (
          <QueryRow
            key={s}
            title={g.name}
            queryKey={["discover", type, id]}
            fetcher={() => api.discover(type, { genreId: id })}
            type={type}
            seeAllHref={`/categorias/${slug}/${id}-${g.slug}`}
          />
        );
      })}
    </div>
  );
}
