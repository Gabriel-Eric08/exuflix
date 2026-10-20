import { useState } from "react";
import { Plus } from "lucide-react";
import type { MediaType } from "../api/types";
import { useWatchlist, fromSnapshot } from "../storage/watchlist";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { TitleCard } from "../components/TitleCard";
import styles from "./MyList.module.css";

type Filter = "all" | MediaType;

export default function MyList() {
  useDocumentTitle("Minha lista");
  const { list } = useWatchlist();
  const [filter, setFilter] = useState<Filter>("all");
  const items = [...list].sort((a, b) => b.addedAt - a.addedAt).filter(i => filter === "all" || i.type === filter);

  return (
    <main className="page">
      <div className={styles.head}>
        <h1 className="page-title" style={{ padding: 0 }}>Minha lista</h1>
        {list.length > 0 && (
          <div className={styles.chips} role="group" aria-label="Filtrar">
            {([["all", "Tudo"], ["movie", "Filmes"], ["tv", "Séries"]] as const).map(([v, l]) => (
              <button key={v} className="chip" aria-pressed={filter === v} onClick={() => setFilter(v)}>
                {l}
              </button>
            ))}
          </div>
        )}
      </div>
      {list.length === 0 ? (
        <p className="empty">
          Sua lista está esperando. Toque no <Plus size={16} style={{ verticalAlign: "-3px" }} aria-label="+" /> em qualquer título.
        </p>
      ) : items.length === 0 ? (
        <p className="empty">Nenhum {filter === "movie" ? "filme" : "série"} na sua lista ainda.</p>
      ) : (
        <div className="poster-grid">
          {items.map(i => (
            <TitleCard key={i.key} item={fromSnapshot(i)} />
          ))}
        </div>
      )}
    </main>
  );
}
