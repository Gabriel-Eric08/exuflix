import { useWatchlist, fromSnapshot } from "../storage/watchlist";
import { Row, RowItem } from "./Row";
import { TitleCard } from "./TitleCard";

/** Linha "Minha lista" na home, direto do localStorage. */
export function WatchlistRow() {
  const { list } = useWatchlist();
  if (list.length === 0) return null;
  return (
    <Row title="Minha lista" seeAllHref="/minha-lista">
      {list.slice(0, 20).map(i => (
        <RowItem key={i.key}>
          <TitleCard item={fromSnapshot(i)} />
        </RowItem>
      ))}
    </Row>
  );
}
