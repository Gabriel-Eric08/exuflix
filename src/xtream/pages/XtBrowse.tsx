import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, Rows3 } from "lucide-react";
import type { MediaType } from "../../api/types";
import { typeSlug, XT_BASE } from "../../app/routes";
import { Hero } from "../../components/Hero";
import { InfiniteGrid } from "../../components/InfiniteGrid";
import { SkeletonRow } from "../../components/Row";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useXtCategories, useXtTitles } from "../queries";
import { ORDERS, XtError, XtRow, inCategory, sortTitles, usedCategories, useXtHero, type Order } from "./shared";
import styles from "../../pages/Browse.module.css";

export default function XtBrowse({ type }: { type: MediaType }) {
  const [params, setParams] = useSearchParams();
  const label = type === "movie" ? "Filmes" : "Séries";
  useDocumentTitle(label);

  const q = useXtTitles(type);
  const { data: cats } = useXtCategories(type === "movie" ? "vod" : "series");

  const category = params.get("categoria") ? Number(params.get("categoria")) : undefined;
  const order = (params.get("ordem") as Order | null) ?? undefined;
  const year = params.get("ano") ? Number(params.get("ano")) : undefined;
  const filtered = category !== undefined || order !== undefined || year !== undefined;
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

  const recent = useMemo(() => sortTitles(q.data ?? [], "recentes"), [q.data]);
  const years = useMemo(() => [...new Set(recent.map(t => t.year).filter((y): y is number => !!y))].sort((a, b) => b - a), [recent]);
  const hero = useXtHero(recent, 1);

  const items = useMemo(() => {
    let out = q.data ?? [];
    if (category !== undefined) out = inCategory(out, category);
    if (year !== undefined) out = out.filter(t => t.year === year);
    return sortTitles(out, order ?? "recentes");
  }, [q.data, category, year, order]);

  if (q.isError) return <main><XtError error={q.error} onRetry={() => q.refetch()} /></main>;

  const used = usedCategories(recent);
  const catOptions = (cats ?? []).filter(c => used.has(c.id));

  return (
    <main>
      <Hero items={hero.items} loading={q.isLoading || hero.loading} />

      <div className={styles.filters} role="toolbar" aria-label={`Filtros de ${label}`}>
        <h1 className={styles.heading}>{label}</h1>
        <select className="select" value={category ?? ""} onChange={e => set("categoria", e.target.value || undefined)} aria-label="Categorias">
          <option value="">Categorias</option>
          {catOptions.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className={styles.chips}>
          {ORDERS.map(o => (
            <button key={o.value} className="chip" aria-pressed={order === o.value} onClick={() => set("ordem", order === o.value ? undefined : o.value)}>
              {o.label}
            </button>
          ))}
        </div>
        {years.length > 0 && (
          <select className="select" value={year ?? ""} onChange={e => set("ano", e.target.value || undefined)} aria-label="Ano">
            <option value="">Ano</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}
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
        <div className={styles.grid}>
          <InfiniteGrid
            items={items}
            isLoading={q.isLoading}
            isError={q.isError}
            onRetry={() => q.refetch()}
            requirePoster={false}
            empty={<p className="empty">Nenhum título com esses filtros. Tente outra combinação.</p>}
          />
        </div>
      ) : (
        <div className={styles.rows}>
          {q.isLoading ? (
            Array.from({ length: 4 }, (_, i) => <SkeletonRow key={i} />)
          ) : (
            <>
              <XtRow title="Adicionados recentemente" items={recent} seeAllHref={`${XT_BASE}/${type === "movie" ? "filmes" : "series"}?ordem=recentes`} />
              <XtRow title="Mais bem avaliados" items={sortTitles(q.data ?? [], "avaliados")} seeAllHref={`${XT_BASE}/${type === "movie" ? "filmes" : "series"}?ordem=avaliados`} />
              {catOptions.map(c => (
                <XtRow key={c.id} title={c.name} items={inCategory(recent, c.id)} seeAllHref={`${XT_BASE}/categorias/${typeSlug(type)}/${c.id}`} />
              ))}
            </>
          )}
        </div>
      )}
    </main>
  );
}
