import { useWatchlist, fromSnapshot } from "../storage/watchlist";
import { useHrefs } from "../catalog/CatalogContext";
import { Row, RowItem } from "./Row";
import { TitleCard } from "./TitleCard";

/** Linha "Minha lista" na home, direto do localStorage. */
export function WatchlistRow() {
  const { list } = useWatchlist();
  const hrefs = useHrefs();
  if (list.length === 0) return null;
  return (
    <Row title="Minha lista" seeAllHref={hrefs.to("/minha-lista")}>
      {list.slice(0, 20).map(i => (
        <RowItem key={i.key}>
          <TitleCard item={fromSnapshot(i)} />
        </RowItem>
      ))}
    </Row>
  );
}
