import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import type { TitleSummary } from "../../api/types";
import { Row, RowItem, SkeletonRow } from "../../components/Row";
import { TitleCard } from "../../components/TitleCard";
import { useInView } from "../../hooks/useInView";
import { refreshAccount, useXtreamAccount } from "../credentials";
import { openAccount, openLogin } from "../LoginModal";
import { xtTitleQuery } from "../queries";

let refreshed = false;

/** Área só com conta conectada. Sem conta: volta ao Exuflix e abre o login. */
export function XtGuard({ children }: { children: ReactNode }) {
  const account = useXtreamAccount();
  useEffect(() => {
    if (!account) openLogin();
    else if (!refreshed) {
      // Atualiza validade/conexões uma vez por carregamento
      refreshed = true;
      refreshAccount(account);
    }
  }, [!!account]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!account) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export type Order = "recentes" | "az" | "avaliados";

export const ORDERS: { value: Order; label: string }[] = [
  { value: "recentes", label: "Adicionados recentemente" },
  { value: "avaliados", label: "Mais bem avaliados" },
  { value: "az", label: "A–Z" },
];

const collator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

export function sortTitles(items: TitleSummary[], order: Order): TitleSummary[] {
  const out = [...items];
  if (order === "az") return out.sort((a, b) => collator.compare(a.title, b.title));
  if (order === "avaliados") return out.filter(t => t.rating > 0).sort((a, b) => b.rating - a.rating || b.popularity - a.popularity);
  return out.sort((a, b) => b.popularity - a.popularity);
}

export const inCategory = (items: TitleSummary[], id: number) => items.filter(t => t.genreIds.includes(id));

/** Linha de pôsteres a partir de uma lista já carregada. Só monta os cards perto do viewport. */
export function XtRow({ title, items, seeAllHref, limit = 30 }: { title: string; items: TitleSummary[]; seeAllHref?: string; limit?: number }) {
  const [ref, inView] = useInView<HTMLDivElement>("600px");
  if (items.length === 0) return null;
  return (
    <div ref={ref}>
      {inView ? (
        <Row title={title} seeAllHref={seeAllHref}>
          {items.slice(0, limit).map(item => (
            <RowItem key={item.key}>
              <TitleCard item={item} />
            </RowItem>
          ))}
        </Row>
      ) : (
        <SkeletonRow title={title} />
      )}
    </div>
  );
}

/** IDs de categoria que têm pelo menos um título. */
export const usedCategories = (items: TitleSummary[]) => {
  const ids = new Set<number>();
  for (const t of items) for (const id of t.genreIds) ids.add(id);
  return ids;
};

/**
 * Destaques: as listas de filmes não trazem fundo nem sinopse, então busca os detalhes
 * dos primeiros candidatos e usa os que vierem com imagem de fundo.
 */
export function useXtHero(candidates: TitleSummary[], max = 5): { items: TitleSummary[]; loading: boolean } {
  const pick = candidates.slice(0, max * 2);
  const isReady = (t: TitleSummary) => !!(t.backdrop && t.overview);
  const need = pick.filter(t => !isReady(t)).slice(0, max);
  const results = useQueries({ queries: need.map(t => xtTitleQuery(t.type, t.id)) });
  const fetched = new Map(results.map((r, i) => [need[i].key, r.data]));
  // Mantém a ordem dos candidatos (o mais recente primeiro)
  const items = pick
    .map(t => {
      if (isReady(t)) return t;
      const d = fetched.get(t.key);
      return d?.backdrop ? { ...d, overview: d.overview || " " } : null;
    })
    .filter((t): t is TitleSummary => !!t)
    .slice(0, max);
  const loading = items.length === 0 && results.some(r => r.isLoading);
  return { items, loading };
}

/** Falha ao falar com o servidor IPTV. */
export function XtError({ onRetry, error }: { onRetry: () => void; error?: unknown }) {
  const msg = (error as Error | undefined)?.message;
  return (
    <div className="empty" style={{ paddingTop: 140 }}>
      <p style={{ marginBottom: 8, fontWeight: 700, color: "var(--text-1)" }}>Não conseguimos falar com o servidor IPTV.</p>
      {msg && <p style={{ marginBottom: 16 }}>{msg}</p>}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={onRetry}>Tentar de novo</button>
        <button className="btn btn-ghost" onClick={openAccount}>Conta IPTV</button>
      </div>
    </div>
  );
}
