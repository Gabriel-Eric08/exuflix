import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ListVideo, SkipForward } from "lucide-react";
import { api } from "../api/endpoints";
import { img } from "../api/images";
import { toEpisodes } from "../api/normalize";
import type { Episode, TitleDetails } from "../api/types";
import { useSeason, useTitle } from "../hooks/queries";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useProgressTracker } from "../hooks/useProgressTracker";
import { detailsHref, episodeHref } from "../app/routes";
import { usePreferences } from "../storage/preferences";
import { useSeriesProgress } from "../storage/progress";
import { VideoPlayer } from "./VideoPlayer";
import { EpisodePanel, NextEpisodeCard, SkipIntroButton } from "./PlayerBits";
import { PlayerSkeleton } from "./PlayerSkeleton";
import { ResumeGate } from "./ResumeGate";
import { nextEpisode } from "./nextEpisode";
import { resolveEpisode, useRegistry, type VideoSource } from "./sources";
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

  const { data: show, isError } = useTitle("tv", id);
  const { data: episodes } = useSeason(id, s);
  const { data: registry } = useRegistry();
  const { data: source } = useQuery({ queryKey: ["src", "tv", id, s, e], queryFn: () => resolveEpisode(id, s, e) });
  const ep = episodes?.find(x => x.episode === e);

  // Episódios seguidos em autoplay sem interação (sobrevive à troca de episódio)
  const autoChain = useRef(0);
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

  // Troca de episódio não recarrega a página: só a URL e a fonte mudam
  const goTo = useCallback(
    (season: number, episode: number) => navigate(episodeHref(id, season, episode), { replace: true }),
    [id, navigate],
  );

  if (source === null) return <Navigate to={detailsHref("tv", id)} replace />;
  if (!source || (!show && !isError)) return <PlayerSkeleton />;

  return (
    <div className={styles.page}>
      <EpisodeSession
        key={`${s}-${e}`}
        show={show}
        id={id}
        season={s}
        episode={e}
        ep={ep}
        source={source}
        next={next}
        nextAvailable={nextAvailable}
        nextInfo={nextInfo}
        autoChain={autoChain}
        goTo={goTo}
        back={back}
      />
    </div>
  );
}

function EpisodeSession({
  show,
  id,
  season: s,
  episode: e,
  ep,
  source,
  next,
  nextAvailable,
  nextInfo,
  autoChain,
  goTo,
  back,
}: {
  show: TitleDetails | undefined;
  id: number;
  season: number;
  episode: number;
  ep: Episode | undefined;
  source: VideoSource;
  next: { season: number; episode: number } | null;
  nextAvailable: boolean;
  nextInfo: Episode | undefined;
  autoChain: React.MutableRefObject<number>;
  goTo: (s: number, e: number) => void;
  back: () => void;
}) {
  const [prefs] = usePreferences();
  const progress = useSeriesProgress(id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [panel, setPanel] = useState(false);
  const [dismissedNext, setDismissedNext] = useState(false);
  const [stillWatching, setStillWatching] = useState(false);

  const tracker = useProgressTracker({
    kind: "episode",
    id,
    season: s,
    episode: e,
    meta: show && { title: show.title, poster: show.poster, backdrop: show.backdrop, episodeTitle: ep?.title, still: ep?.still },
    creditsStart: source.markers?.creditsStart,
  });

  const userActivity = useCallback(() => {
    autoChain.current = 0;
  }, [autoChain]);

  const playNext = () => {
    if (next && nextAvailable) goTo(next.season, next.episode);
  };

  const autoAdvance = () => {
    if (!next || !nextAvailable) return;
    // Proteção contra maratona esquecida
    if (autoChain.current >= MAX_AUTOPLAY_CHAIN) {
      videoRef.current?.pause();
      setStillWatching(true);
      return;
    }
    autoChain.current += 1;
    playNext();
  };

  const skipIntro = () => {
    const end = source.markers?.introEnd;
    const v = videoRef.current;
    if (end !== undefined && v && v.currentTime < end) v.currentTime = end;
  };

  const name = show?.title ?? "Série";
  const epLabel = `T${s}:E${e}${ep?.title ? ` · ${ep.title}` : ""}`;
  const creditsAt = source.markers?.creditsStart;

  return (
    <ResumeGate saved={progress?.episodes[`s${s}e${e}`]} title={name} subtitle={epLabel} backdrop={ep?.still ?? show?.backdrop}>
      {startAt => (
        <VideoPlayer
          ref={videoRef}
          source={source}
          startAt={startAt}
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
          onTime={tracker.onTime}
          onPause={tracker.onPause}
          onSeeked={tracker.onSeeked}
          onEnded={() => {
            tracker.onEnded();
            if (prefs.autoplayNext && !dismissedNext) autoAdvance();
          }}
          onNext={next && nextAvailable ? () => { userActivity(); playNext(); } : undefined}
          onSkipIntro={skipIntro}
          extraControls={
            <>
              {next && nextAvailable && (
                <button
                  className={styles.ctrl}
                  onClick={() => { userActivity(); playNext(); }}
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
            // Card aparece em creditsStart ou, sem marcador, nos últimos 30 s
            const inCredits = duration > 0 && (creditsAt !== undefined ? current >= creditsAt : duration - current <= 30);
            return (
              <>
                {source.attribution && <p className={styles.attribution}>{source.attribution}</p>}
                <SkipIntroButton
                  markers={source.markers}
                  current={current}
                  controlsVisible={controlsVisible}
                  onSkip={() => {
                    userActivity();
                    skipIntro();
                  }}
                />
                {inCredits && next && !dismissedNext && !stillWatching && !panel && (
                  <NextEpisodeCard
                    label={`T${next.season}:E${next.episode}${nextInfo?.title ? ` · ${nextInfo.title}` : ""}`}
                    still={nextInfo?.still}
                    available={nextAvailable}
                    autoplay={prefs.autoplayNext}
                    onPlay={auto => {
                      if (auto) return autoAdvance();
                      userActivity();
                      playNext();
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
                          playNext();
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
                    onPick={(ss, ee) => {
                      userActivity();
                      setPanel(false);
                      goTo(ss, ee);
                    }}
                    onClose={() => setPanel(false)}
                  />
                )}
              </>
            );
          }}
        </VideoPlayer>
      )}
    </ResumeGate>
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
