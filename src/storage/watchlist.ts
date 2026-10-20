import { useStored } from "./useStored";
import type { MetaSnapshot } from "./progress";

export interface WatchlistItem {
  key: string;
  type: "movie" | "tv";
  id: number;
  addedAt: number;
  meta: MetaSnapshot;
}

const EMPTY: WatchlistItem[] = [];

export const useWatchlist = () => {
  const [list, setList] = useStored<WatchlistItem[]>("watchlist", EMPTY);
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
