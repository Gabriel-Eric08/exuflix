import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { MediaType } from "../../api/types";
import { InfiniteGrid } from "../../components/InfiniteGrid";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { MobileSearchField, RecentSearches } from "../../pages/Search";
import { useRecentSearches } from "../../storage/searches";
import { fold, searchTitles, useXtLive, useXtTitles } from "../queries";
import { ChannelCard } from "./LiveTV";
import { XtRow, sortTitles } from "./shared";
import styles from "../../pages/Search.module.css";
import liveStyles from "./LiveTV.module.css";

type Filter = "all" | MediaType | "live";

/** Busca local: as listas completas já estão em cache, então filtra no navegador. */
export default function XtSearch() {
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  useDocumentTitle(q ? `Busca: ${q}` : "Busca");
  const recent = useRecentSearches();
  const [filter, setFilter] = useState<Filter>("all");
  const movies = useXtTitles("movie");
  const series = useXtTitles("tv");
  const live = useXtLive();

  const titles = useMemo(() => searchTitles([...(movies.data ?? []), ...(series.data ?? [])], q), [movies.data, series.data, q]);
  const channels = useMemo(() => {
    const f = fold(q);
    return f.length < 2 ? [] : (live.data ?? []).filter(c => fold(c.name).includes(f)).slice(0, 60);
  }, [live.data, q]);

  useEffect(() => {
    if (q.length >= 2 && (titles.length > 0 || channels.length > 0)) recent.add(q);
  }, [q, titles.length > 0 || channels.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = titles.filter(i => filter === "all" || i.type === filter);
  const loading = movies.isLoading || series.isLoading;

  return (
    <main className="page">
      <MobileSearchField initial={q} placeholder="Filmes, séries e canais" />
      {q.length < 2 ? (
        <>
          <RecentSearches recent={recent} />
          <XtRow title="Adicionados recentemente" items={sortTitles(movies.data ?? [], "recentes")} />
        </>
      ) : (
        <>
          <div className={styles.head}>
            <h1 className={styles.title}>
              Resultados para <span>“{q}”</span>
            </h1>
            <div className={styles.chips} role="group" aria-label="Filtrar resultados">
              {([["all", "Tudo"], ["tv", "Séries"], ["movie", "Filmes"], ["live", "Canais"]] as const).map(([v, l]) => (
                <button key={v} className="chip" aria-pressed={filter === v} onClick={() => setFilter(v)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {(filter === "all" || filter === "live") && channels.length > 0 && (
            <section className={styles.section} style={{ padding: "0 var(--gutter)" }}>
              <div className={styles.sectionHead} style={{ padding: 0 }}>
                <h2>Canais ao vivo</h2>
              </div>
              <div className={liveStyles.grid}>
                {channels.slice(0, filter === "live" ? 60 : 6).map(c => (
                  <ChannelCard key={c.key} channel={c} />
                ))}
              </div>
            </section>
          )}
          {filter !== "live" && (
            <InfiniteGrid
              items={items}
              isLoading={loading}
              isError={movies.isError && series.isError}
              onRetry={() => { movies.refetch(); series.refetch(); }}
              requirePoster={false}
              empty={channels.length === 0 ? <p className="empty">Nenhum caminho deu em ‘{q}’. Tente outro nome.</p> : <span />}
            />
          )}
          {filter === "live" && channels.length === 0 && <p className="empty">Nenhum canal com ‘{q}’.</p>}
        </>
      )}
    </main>
  );
}
