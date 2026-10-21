import { useCatalog } from "../catalog/CatalogContext";
import { useStored } from "./useStored";

const EMPTY: string[] = [];
const MAX = 8;

export function useRecentSearches() {
  const [list, setList] = useStored<string[]>(useCatalog().ns + "searches", EMPTY);
  const add = (term: string) => {
    const t = term.trim();
    if (t.length < 2) return;
    setList(prev => [t, ...prev.filter(x => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX));
  };
  const remove = (term: string) => setList(prev => prev.filter(x => x !== term));
  const clear = () => setList([]);
  return { list, add, remove, clear };
}
