import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Clock, Search as SearchIcon, X } from "lucide-react";
import { api } from "../api/endpoints";
import type { MediaType } from "../api/types";
import { useRow, useSearch } from "../hooks/queries";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useRecentSearches } from "../storage/searches";
import { InfiniteGrid } from "../components/InfiniteGrid";
import { TitleCard } from "../components/TitleCard";
import { useHrefs } from "../catalog/CatalogContext";
import styles from "./Search.module.css";

type Filter = "all" | MediaType;

export default function Search() {
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  useDocumentTitle(q ? `Busca: ${q}` : "Busca");
  const recent = useRecentSearches();
  const [filter, setFilter] = useState<Filter>("all");
  const results = useSearch(q);

  // Termo com resultado vira "busca recente"
  useEffect(() => {
    if (q.length >= 2 && results.data && results.data.length > 0) recent.add(q);
  }, [q, results.data && results.data.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = results.data?.filter(i => filter === "all" || i.type === filter);

  return (
    <main className="page">
      <MobileSearchField initial={q} />
      {q.length < 2 ? (
        <Suggestions recent={recent} />
      ) : (
        <>
          <div className={styles.head}>
            <h1 className={styles.title}>
              Resultados para <span>“{q}”</span>
            </h1>
            <div className={styles.chips} role="group" aria-label="Filtrar resultados">
              {([["all", "Tudo"], ["tv", "Séries"], ["movie", "Filmes"]] as const).map(([v, l]) => (
                <button key={v} className="chip" aria-pressed={filter === v} onClick={() => setFilter(v)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <InfiniteGrid
            items={items}
            isLoading={results.isLoading}
            isError={results.isError}
            hasNextPage={results.hasNextPage}
            isFetchingNextPage={results.isFetchingNextPage}
            fetchNextPage={results.fetchNextPage}
            onRetry={() => results.refetch()}
            empty={<p className="empty">Nenhum caminho deu em ‘{q}’. Tente outro nome.</p>}
          />
        </>
      )}
    </main>
  );
}

/** No mobile a navbar não tem campo: a página traz o próprio. */
export function MobileSearchField({ initial, placeholder = "Títulos, gente, gêneros" }: { initial: string; placeholder?: string }) {
  const searchPath = `${useHrefs().base}/busca`;
  const navigate = useNavigate();
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => setValue(initial), [initial]);
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches && !initial) ref.current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = value.trim();
    if (t === initial) return;
    const id = setTimeout(() => navigate(t ? `${searchPath}?q=${encodeURIComponent(t)}` : searchPath, { replace: true }), 300);
    return () => clearTimeout(id);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.mobileField}>
      <SearchIcon size={20} aria-hidden />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar títulos"
      />
      {value && (
        <button aria-label="Limpar busca" onClick={() => setValue("")}>
          <X size={18} />
        </button>
      )}
    </div>
  );
}

export function RecentSearches({ recent }: { recent: ReturnType<typeof useRecentSearches> }) {
  const searchPath = `${useHrefs().base}/busca`;
  if (recent.list.length === 0) return null;
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2>Buscas recentes</h2>
        <button className={styles.clearAll} onClick={recent.clear}>Limpar</button>
      </div>
      <ul className={styles.recent}>
        {recent.list.map(term => (
          <li key={term}>
            <Link to={`${searchPath}?q=${encodeURIComponent(term)}`} className={styles.recentItem}>
              <Clock size={16} aria-hidden /> {term}
            </Link>
            <button aria-label={`Remover “${term}”`} onClick={() => recent.remove(term)} className={styles.remove}>
              <X size={16} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Suggestions({ recent }: { recent: ReturnType<typeof useRecentSearches> }) {
  const trending = useRow(["trending", "all", "day"], () => api.trending("all", "day"));
  return (
    <>
      <RecentSearches recent={recent} />
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Em alta</h2>
        </div>
        <div className="poster-grid">
          {(trending.data ?? []).filter(t => t.poster).slice(0, 18).map(t => (
            <TitleCard key={t.key} item={t} />
          ))}
        </div>
      </section>
    </>
  );
}
