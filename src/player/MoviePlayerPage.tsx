import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTitle } from "../hooks/queries";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { detailsHref } from "../app/routes";
import { EMPTY_PROGRESS, type ProgressStore } from "../storage/progress";
import { update } from "../storage/store";
import { PlayerSkeleton } from "./PlayerSkeleton";
import { getMovieEmbedUrl } from "./embed";
import { EmbedPlayer } from "./EmbedPlayer";

export function useBack(fallback: string) {
  const navigate = useNavigate();
  return () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  };
}

export default function MoviePlayerPage() {
  const id = Number(useParams().id);
  const { data: title, isError } = useTitle("movie", id);
  const back = useBack(detailsHref("movie", id));
  useDocumentTitle(title ? `Assistindo ${title.title}` : null);

  // Registra início de exibição na lista de progresso
  useEffect(() => {
    if (title) {
      update<ProgressStore>("progress", EMPTY_PROGRESS, store => {
        const items = { ...store.items };
        items[`movie:${id}`] = {
          type: "movie",
          id,
          position: 1,
          duration: (title.runtime ?? 120) * 60,
          completed: false,
          updatedAt: Date.now(),
          meta: { title: title.title, poster: title.poster, backdrop: title.backdrop },
        };
        return { ...store, items };
      });
    }
  }, [id, title]);

  if (!title && !isError) return <PlayerSkeleton />;

  return (
    <EmbedPlayer
      src={getMovieEmbedUrl(id)}
      title={title?.title ?? "Filme"}
      subtitle={title?.year ? String(title.year) : undefined}
      onBack={back}
    />
  );
}
