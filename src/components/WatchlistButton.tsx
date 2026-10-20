import { Check, Plus } from "lucide-react";
import type { TitleSummary } from "../api/types";
import { useWatchlist } from "../storage/watchlist";
import { toast } from "./Toast";

interface Props {
  item: Pick<TitleSummary, "key" | "type" | "id" | "title" | "poster" | "backdrop">;
  variant?: "icon" | "button";
}

export function WatchlistButton({ item, variant = "icon" }: Props) {
  const { has, toggle } = useWatchlist();
  const inList = has(item.key);
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = toggle({
      key: item.key,
      type: item.type,
      id: item.id,
      meta: { title: item.title, poster: item.poster, backdrop: item.backdrop },
    });
    toast(added ? "Adicionado à Minha lista" : "Removido da Minha lista");
  };
  const label = inList ? "Remover da Minha lista" : "Adicionar à Minha lista";
  const Icon = inList ? Check : Plus;

  if (variant === "button") {
    return (
      <button className="btn btn-ghost" onClick={onClick} aria-pressed={inList} aria-label={label}>
        <Icon size={20} /> Minha lista
      </button>
    );
  }
  return (
    <button className="icon-btn" onClick={onClick} aria-pressed={inList} aria-label={label} title={label}>
      <Icon size={18} />
    </button>
  );
}
