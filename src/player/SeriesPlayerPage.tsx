import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ListVideo, SkipBack, SkipForward } from "lucide-react";
import { useSeason, useTitle } from "../hooks/queries";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { detailsHref, episodeHref } from "../app/routes";
import { EMPTY_PROGRESS, type ProgressStore } from "../storage/progress";
import { update } from "../storage/store";
import { EpisodePanel } from "./PlayerBits";
import { PlayerSkeleton } from "./PlayerSkeleton";
import { nextEpisode, previousEpisode } from "./nextEpisode";
import { getSeriesEmbedUrl } from "./embed";
import { EmbedPlayer } from "./EmbedPlayer";
import { useBack } from "./MoviePlayerPage";
import styles from "./Player.module.css";

export default function SeriesPlayerPage() {
  const { id: idStr, temporada, episodio } = useParams();
  const id = Number(idStr);
  const s = Number(temporada);
  const e = Number(episodio);
  const navigate = useNavigate();

  const { data: show, isError } = useTitle("tv", id);
  const { data: episodes } = useSeason(id, s);
  const ep = episodes?.find(x => x.episode === e);
  const [panelOpen, setPanelOpen] = useState(false);

  const back = useBack(detailsHref("tv", id));
  useDocumentTitle(show ? `${show.title} · T${s}:E${e}` : null);

  const prev = show?.seasons ? previousEpisode(show.seasons, s, e) : null;
  const next = show?.seasons ? nextEpisode(show.seasons, s, e) : null;

  // Troca de episódio não recarrega a página: só a URL e a fonte mudam
  const goTo = useCallback(
    (season: number, episode: number) => navigate(episodeHref(id, season, episode), { replace: true }),
    [id, navigate],
  );

  // Registra início de exibição na lista de progresso
  useEffect(() => {
    if (show) {
      update<ProgressStore>("progress", EMPTY_PROGRESS, store => {
        const items = { ...store.items };
        const key = `tv:${id}`;
        const existing = items[key]?.type === "tv" ? items[key] : undefined;
        const epKey = `s${s}e${e}`;
        items[key] = {
          type: "tv",
          id,
          current: { season: s, episode: e },
          updatedAt: Date.now(),
          meta: { title: show.title, poster: show.poster, backdrop: show.backdrop },
          episodes: {
            ...(existing?.episodes ?? {}),
            [epKey]: {
              position: 1,
              duration: (ep?.runtime ?? 45) * 60,
              completed: false,
              updatedAt: Date.now(),
              title: ep?.title ?? `Episódio ${e}`,
              still: ep?.still ?? null,
            },
          },
        };
        return { ...store, items };
      });
    }
  }, [id, s, e, show, ep]);

  if (!show && !isError) return <PlayerSkeleton />;

  return (
    <>
      <EmbedPlayer
        src={getSeriesEmbedUrl(id, s, e)}
        title={show?.title ?? "Série"}
        subtitle={`T${s}:E${e}${ep?.title ? ` · ${ep.title}` : ""}`}
        onBack={back}
      >
        <button
          className={styles.embedNavBtn}
          disabled={!prev}
          onClick={() => prev && goTo(prev.season, prev.episode)}
          title={prev ? `Anterior: T${prev.season}:E${prev.episode}` : "Primeiro episódio"}
          aria-label="Episódio anterior"
        >
          <SkipBack size={14} />
          <span className={styles.hideMobile}>Anterior</span>
        </button>
        <button
          className={styles.embedNavBtn}
          disabled={!next}
          onClick={() => next && goTo(next.season, next.episode)}
          title={next ? `Próximo: T${next.season}:E${next.episode}` : "Último episódio"}
          aria-label="Próximo episódio"
        >
          <span className={styles.hideMobile}>Próximo</span>
          <SkipForward size={14} />
        </button>
        {show?.seasons && (
          <button
            className={styles.embedNavBtn}
            onClick={() => setPanelOpen(true)}
            aria-label="Lista de episódios"
          >
            <ListVideo size={14} />
            <span>Episódios</span>
          </button>
        )}
      </EmbedPlayer>

      {panelOpen && show?.seasons && (
        <EpisodePanel
          tvId={id}
          seasons={show.seasons}
          current={{ season: s, episode: e }}
          onPick={(ss, ee) => {
            setPanelOpen(false);
            goTo(ss, ee);
          }}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </>
  );
}

/** /assistir/serie/:id → exibe o embed da série completa (Lista de episódios: /serie/:id). */
export function SeriesEntry() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { data: show, isError } = useTitle("tv", id);
  const back = useBack(detailsHref("tv", id));
  const [panelOpen, setPanelOpen] = useState(false);

  if (!show && !isError) return <PlayerSkeleton />;

  return (
    <>
      <EmbedPlayer
        src={getSeriesEmbedUrl(id)}
        title={show?.title ?? "Série"}
        subtitle="Lista de episódios"
        onBack={back}
      >
        {show?.seasons && (
          <button
            className={styles.embedNavBtn}
            onClick={() => setPanelOpen(true)}
            aria-label="Lista de episódios"
          >
            <ListVideo size={14} />
            <span>Episódios</span>
          </button>
        )}
      </EmbedPlayer>

      {panelOpen && show?.seasons && (
        <EpisodePanel
          tvId={id}
          seasons={show.seasons}
          current={{ season: 1, episode: 1 }}
          onPick={(ss, ee) => {
            setPanelOpen(false);
            navigate(episodeHref(id, ss, ee));
          }}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </>
  );
}
