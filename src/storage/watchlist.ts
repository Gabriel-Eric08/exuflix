import { useCatalog } from "../catalog/CatalogContext";
import { useStored } from "./useStored";
import type { MetaSnapshot } from "./progress";
import type { TitleSummary } from "../api/types";

export interface WatchlistItem {
  key: string;
  type: "movie" | "tv";
  id: number;
  addedAt: number;
  meta: MetaSnapshot;
}

const EMPTY: WatchlistItem[] = [];

export const useWatchlist = () => {
  const [list, setList] = useStored<WatchlistItem[]>(useCatalog().ns + "watchlist", EMPTY);
  const has = (key: string) => list.some(i => i.key === key);
  /** Retorna true se o item foi adicionado, false se foi removido. */
  const toggle = (item: Omit<WatchlistItem, "addedAt">) => {
    const adding = !has(item.key);
    setList(prev =>
      prev.some(i => i.key === item.key)
        ? prev.filter(i => i.key !== item.key)
        : [{ ...item, addedAt: Date.now() }, ...prev].slice(0, 500),
    );
    return adding;
  };
  return { list, has, toggle };
};

/** Reconstrói um TitleSummary a partir do snapshot salvo: renderiza cards sem chamar a API. */
export const fromSnapshot = (i: Pick<WatchlistItem, "key" | "type" | "id" | "meta">): TitleSummary => ({
  key: i.key,
  id: i.id,
  type: i.type,
  title: i.meta.title,
  originalTitle: i.meta.title,
  overview: "",
  year: null,
  rating: 0,
  voteCount: 0,
  genreIds: [],
  poster: i.meta.poster,
  backdrop: i.meta.backdrop,
  popularity: 0,
});
