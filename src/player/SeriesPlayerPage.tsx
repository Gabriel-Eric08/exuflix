import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ListVideo, SkipForward } from "lucide-react";
import { api } from "../api/endpoints";
import { img } from "../api/images";
import { toEpisodes } from "../api/normalize";
import { useSeason, useTitle } from "../hooks/queries";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { detailsHref, episodeHref } from "../app/routes";
import { usePreferences } from "../storage/preferences";
import { useSeriesProgress } from "../storage/progress";
import { VideoPlayer } from "./VideoPlayer";
import { EpisodePanel, NextEpisodeCard, PlayerSkeleton, SkipIntroButton } from "./PlayerBits";
import { nextEpisode } from "./nextEpisode";
import { resolveEpisode, useRegistry } from "./sources";
import { useBack } from "./MoviePlayerPage";
import styles from "./Player.module.css";

const MAX_AUTOPLAY_CHAIN = 3;

export default function SeriesPlayerPage() {
  const { id: idStr, temporada, episodio } = useParams();
  const id = Number(idStr);
  const s = Number(temporada);
  const e = Number(episodio);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [prefs] = usePreferences();

  const { data: show, isError } = useTitle("tv", id);
  const { data: episodes } = useSeason(id, s);
  const { data: registry } = useRegistry();
  const { data: source } = useQuery({ queryKey: ["src", "tv", id, s, e], queryFn: () => resolveEpisode(id, s, e) });
  const ep = episodes?.find(x => x.episode === e);

  const [panel, setPanel] = useState(false);
  const [dismissedNext, setDismissedNext] = useState(false);
  const [stillWatching, setStillWatching] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoChain = useRef(0); // episódios seguidos em autoplay sem interação
  const back = useBack(detailsHref("tv", id));

  useDocumentTitle(show ? `${show.title} · T${s}:E${e}` : null);

  const next = show?.seasons ? nextEpisode(show.seasons, s, e) : null;
  const nextAvailable = !!(next && registry?.series?.[id]?.seasons?.[next.season]?.[next.episode]);
  const nextInfo = useNextEpisodeInfo(id, next);

  // Prefetch da temporada seguinte quando está no último episódio
  useEffect(() => {
    if (next && next.season !== s) {
      qc.prefetchQuery({
        queryKey: ["season", id, next.season],
        queryFn: async () => toEpisodes(id, await api.season(id, next.season)),
        staleTime: 6 * 60 * 60 * 1000,
      });
    }
  }, [id, s, next?.season]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setDismissedNext(false);
  }, [s, e]);

  const goTo = useCallback(
    (season: number, episode: number) => {
      setPanel(false);
      navigate(episodeHref(id, season, episode), { replace: true });
    },
    [id, navigate],
  );

  const userActivity = useCallback(() => {
    autoChain.current = 0;
  }, []);

  const autoAdvance = () => {
    if (!next || !nextAvailable) return;
    if (autoChain.current >= MAX_AUTOPLAY_CHAIN) {
      setStillWatching(true);
      return;
    }
    autoChain.current += 1;
    goTo(next.season, next.episode);
  };

  if (source === null) return <Navigate to={detailsHref("tv", id)} replace />;
  if (!source || (!show && !isError)) return <PlayerSkeleton />;

  const name = show?.title ?? "Série";
  const epLabel = `T${s}:E${e}${ep?.title ? ` · ${ep.title}` : ""}`;
  const creditsAt = source.markers?.creditsStart;

  return (
    <div className={styles.page}>
      <VideoPlayer
        key={`${s}-${e}`}
        ref={videoRef}
        source={source}
        heading={
          <>
            {name} <small>· {epLabel}</small>
          </>
        }
        mediaTitle={ep?.title ?? `T${s}:E${e}`}
        mediaArtist={name}
        artwork={img(show?.poster, "w500")}
        poster={img(ep?.still ?? show?.backdrop, "w1280")}
        onBack={back}
        onUserActivity={userActivity}
        onEnded={() => {
          if (prefs.autoplayNext && !dismissedNext) autoAdvance();
        }}
        onNext={next && nextAvailable ? () => { userActivity(); goTo(next.season, next.episode); } : undefined}
        onSkipIntro={() => {
          const end = source.markers?.introEnd;
          const v = videoRef.current;
          if (end !== undefined && v && v.currentTime < end) v.currentTime = end;
        }}
        extraControls={
          <>
            {next && nextAvailable && (
              <button
                className={styles.ctrl}
                onClick={() => { userActivity(); goTo(next.season, next.episode); }}
                aria-label="Próximo episódio"
                title="Próximo episódio (N)"
              >
                <SkipForward size={26} fill="currentColor" />
              </button>
            )}
            {show?.seasons && show.seasons.length > 0 && (
              <button className={styles.ctrl} onClick={() => setPanel(p => !p)} aria-label="Episódios" aria-expanded={panel}>
                <ListVideo size={26} />
              </button>
            )}
          </>
        }
      >
        {({ current, duration, controlsVisible }) => {
          const inCredits = duration > 0 && (creditsAt !== undefined ? current >= creditsAt : duration - current <= 30);
          return (
            <>
              <SkipIntroButton
                markers={source.markers}
                current={current}
                controlsVisible={controlsVisible}
                onSkip={() => {
                  userActivity();
                  const end = source.markers?.introEnd;
                  const v = videoRef.current;
                  if (end !== undefined && v) v.currentTime = end;
                }}
              />
              {inCredits && next && !dismissedNext && !stillWatching && !panel && (
                <NextEpisodeCard
                  label={`T${next.season}:E${next.episode}${nextInfo?.title ? ` · ${nextInfo.title}` : ""}`}
                  still={nextInfo?.still}
                  available={nextAvailable}
                  autoplay={prefs.autoplayNext && autoChain.current < MAX_AUTOPLAY_CHAIN}
                  onPlay={auto => {
                    if (auto) return autoAdvance();
                    userActivity();
                    goTo(next.season, next.episode);
                  }}
                  onDismiss={() => {
                    userActivity();
                    setDismissedNext(true);
                  }}
                />
              )}
              {stillWatching && (
                <div className={styles.full} role="dialog" aria-label="Você ainda está assistindo?">
                  <h2>Você ainda está assistindo?</h2>
                  <p style={{ color: "var(--text-2)" }}>{name}</p>
                  <div className={styles.row}>
                    <button
                      className="btn btn-light"
                      autoFocus
                      onClick={() => {
                        autoChain.current = 0;
                        setStillWatching(false);
                        if (next && nextAvailable) goTo(next.season, next.episode);
                      }}
                    >
                      Continuar assistindo
                    </button>
                    <button className="btn btn-ghost" onClick={back}>Voltar</button>
                  </div>
                </div>
              )}
              {panel && show?.seasons && (
                <EpisodePanel
                  tvId={id}
                  seasons={show.seasons}
                  current={{ season: s, episode: e }}
                  onPick={(ss, ee) => { userActivity(); goTo(ss, ee); }}
                  onClose={() => setPanel(false)}
                />
              )}
            </>
          );
        }}
      </VideoPlayer>
    </div>
  );
}

function useNextEpisodeInfo(id: number, next: { season: number; episode: number } | null) {
  const { data } = useSeason(id, next?.season ?? 0);
  return next ? data?.find(x => x.episode === next.episode) : undefined;
}

/** /assistir/serie/:id → episódio atual salvo, o próximo, ou o primeiro com fonte. */
export function SeriesEntry() {
  const id = Number(useParams().id);
  const { data: show, isError } = useTitle("tv", id);
  const { data: registry } = useRegistry();
  const progress = useSeriesProgress(id);

  if (isError) return <Navigate to={detailsHref("tv", id)} replace />;
  if (!registry || (progress && !show)) return <PlayerSkeleton />;

  if (progress) {
    const { season, episode } = progress.current;
    const cur = progress.episodes[`s${season}e${episode}`];
    if (cur && !cur.completed) return <Navigate to={episodeHref(id, season, episode)} replace />;
    const n = show?.seasons ? nextEpisode(show.seasons, season, episode) : null;
    if (n) return <Navigate to={episodeHref(id, n.season, n.episode)} replace />;
  }

  const seasons = registry.series?.[id]?.seasons;
  if (!seasons) return <Navigate to={detailsHref("tv", id)} replace />;
  const firstSeason = Object.keys(seasons).map(Number).filter(n => n > 0).sort((a, b) => a - b)[0];
  const firstEp = firstSeason ? Object.keys(seasons[firstSeason]).map(Number).sort((a, b) => a - b)[0] : undefined;
  if (!firstSeason || !firstEp) return <Navigate to={detailsHref("tv", id)} replace />;
  return <Navigate to={episodeHref(id, firstSeason, firstEp)} replace />;
}
