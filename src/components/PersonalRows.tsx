import { useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { Play, X } from "lucide-react";
import { useTitle } from "../hooks/queries";
import { tmdbCatalog, useCatalog } from "../catalog/CatalogContext";
import { buildContinueWatching, type ContinueItem } from "../storage/continueWatching";
import { useProgressStore } from "../storage/progress";
import { useStored } from "../storage/useStored";
import { useRegistry } from "../player/sources";
import { Artwork } from "./Artwork";
import { Row, RowItem } from "./Row";
import { TitleCard } from "./TitleCard";
import styles from "./PersonalRows.module.css";

const NO_HIDDEN: string[] = [];

export function useContinueWatching() {
  const catalog = useCatalog();
  const store = useProgressStore();
  const [hidden] = useStored<string[]>(catalog.ns + "hidden", NO_HIDDEN);
  // Séries precisam das temporadas para achar o próximo episódio: busca em segundo plano
  const tvIds = Object.values(store.items).filter(i => i.type === "tv").map(i => i.id);
  const details = useQueries({ queries: tvIds.map(id => catalog.titleQuery("tv", id)) });
  const seasons = new Map(tvIds.map((id, i) => [id, details[i].data?.seasons]));
  return buildContinueWatching(store, hidden, id => seasons.get(id), catalog.base);
}

export function ContinueWatchingRow() {
  const items = useContinueWatching();
  const [, setHidden] = useStored<string[]>(useCatalog().ns + "hidden", NO_HIDDEN);
  if (items.length === 0) return null;
  return (
    <Row title="Continuar assistindo" variant="wide">
      {items.map(item => (
        <RowItem key={item.key}>
          <ContinueCard item={item} onRemove={() => setHidden(h => [...h.filter(k => k !== item.key), item.key])} />
        </RowItem>
      ))}
    </Row>
  );
}

function ContinueCard({ item, onRemove }: { item: ContinueItem; onRemove: () => void }) {
  const navigate = useNavigate();
  return (
    <div className={styles.card}>
      <button className={styles.art} onClick={() => navigate(item.href)} data-card aria-label={`Continuar ${item.title}, ${item.subtitle}`}>
        <Artwork path={item.backdrop} kind="backdrop" title={item.title} sizes="(max-width: 480px) 60vw, (max-width: 1024px) 33vw, 25vw" />
        <span className={styles.play} aria-hidden>
          <Play size={22} fill="currentColor" />
        </span>
        <span className={styles.name}>{item.title}</span>
        <span className={styles.bar} aria-hidden>
          <span style={{ width: `${Math.min(1, item.progress) * 100}%` }} />
        </span>
      </button>
      <div className={styles.info}>
        <span className={styles.subtitle}>{item.subtitle}</span>
        <button className={styles.remove} onClick={onRemove} aria-label={`Remover ${item.title} de Continuar assistindo`} title="Remover da linha">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/** "Porque você assistiu {X}": recomendações do último título em andamento. */
export function BecauseYouWatchedRow() {
  const items = useContinueWatching();
  const last = items[0];
  const { data } = useTitle(last?.type ?? "movie", last?.id ?? 0, !!last);
  if (!last || !data || data.recommendations.length === 0) return null;
  return (
    <Row title={`Porque você assistiu ${last.title}`}>
      {data.recommendations.filter(r => r.poster).map(r => (
        <RowItem key={r.key}>
          <TitleCard item={r} />
        </RowItem>
      ))}
    </Row>
  );
}

/** Títulos presentes em sources.json. */
export function AvailableNowRow() {
  const { data: registry } = useRegistry();
  const ids = [
    ...Object.keys(registry?.movies ?? {}).filter(k => /^\d+$/.test(k)).map(k => ["movie", Number(k)] as const),
    ...Object.keys(registry?.series ?? {}).filter(k => /^\d+$/.test(k)).map(k => ["tv", Number(k)] as const),
  ];
  const results = useQueries({ queries: ids.map(([t, id]) => tmdbCatalog.titleQuery(t, id)) });
  const titles = results.map(r => r.data).filter((d): d is NonNullable<typeof d> => !!d && !!d.poster);
  if (titles.length === 0) return null;
  return (
    <Row title="Disponível agora na Exuflix">
      {titles.map(t => (
        <RowItem key={t.key}>
          <TitleCard item={t} />
        </RowItem>
      ))}
    </Row>
  );
}
