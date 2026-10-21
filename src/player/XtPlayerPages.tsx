import { useCallback, useRef, useState, type ReactNode } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ListVideo, RotateCcw, SkipForward } from "lucide-react";
import { img } from "../api/images";
import type { Episode, TitleDetails } from "../api/types";
import { useHrefs } from "../catalog/CatalogContext";
import { Artwork } from "../components/Artwork";
import { useSeason, useTitle } from "../hooks/queries";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useProgressTracker } from "../hooks/useProgressTracker";
import { usePreferences } from "../storage/preferences";
import { useMovieProgress, useSeriesProgress } from "../storage/progress";
import { episodeUrl, isMixedContent, movieUrl } from "../xtream/client";
import { useXtreamAccount } from "../xtream/credentials";
import { useBack } from "./MoviePlayerPage";
import { EpisodePanel, NextEpisodeCard } from "./PlayerBits";
import { nextEpisode } from "./nextEpisode";
import { PlayerSkeleton } from "./PlayerSkeleton";
import { ResumeGate } from "./ResumeGate";
import { StreamFallback, fallbackReason } from "./StreamFallback";
import type { VideoSource } from "./sources";
import { VideoPlayer } from "./VideoPlayer";
import styles from "./Player.module.css";

const NS = "xt:";
const MAX_AUTOPLAY_CHAIN = 3;

const sourceFor = (url: string, ext?: string | null): VideoSource => ({
  kind: (ext ?? "").toLowerCase() === "m3u8" ? "hls" : "mp4",
  url,
});

/** Página cheia quando o vídeo não pode tocar no navegador (HTTP dentro de HTTPS). */
export function ExternalOnly({
  title,
  subtitle,
  url,
  backdrop,
  reason,
  onBack,
}: {
  title: string;
  subtitle?: ReactNode;
  url: string;
  backdrop?: string | null;
  reason: string;
  onBack: () => void;
}) {
  return (
    <div className={styles.fallbackPage} role="dialog" aria-label={title}>
      {backdrop && <img className={styles.fallbackBg} src={img(backdrop, "w780")!} alt="" />}
      <div>
        <h1>{title}</h1>
        {subtitle && <p style={{ color: "var(--text-2)", fontWeight: 600, marginTop: 4 }}>{subtitle}</p>}
      </div>
      <StreamFallback url={url} title={title} reason={reason} />
      <button className="btn btn-outline" onClick={onBack} autoFocus>
        <ArrowLeft size={20} /> Voltar
      </button>
    </div>
  );
}

// ---------- Filme ----------

export function XtMoviePlayer() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const hrefs = useHrefs();
  const acc = useXtreamAccount();
  const { data: title, isError } = useTitle("movie", id);
  const saved = useMovieProgress(id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);
  const back = useBack(hrefs.details("movie", id));
  useDocumentTitle(title ? `Assistindo ${title.title}` : null);

  const tracker = useProgressTracker(
    { kind: "movie", id, meta: title && { title: title.title, poster: title.poster, backdrop: title.backdrop } },
    NS,
  );

  if (!acc) return <Navigate to="/" replace />;
  if (!title && !isError) return <PlayerSkeleton />;

  const name = title?.title ?? "Filme";
  const ext = title?.container ?? "mp4";
  const url = movieUrl(acc, id, ext);
  if (isMixedContent(url)) {
    return <ExternalOnly title={name} url={url} backdrop={title?.backdrop ?? title?.poster} reason={fallbackReason(true)} onBack={back} />;
  }
  const recs = (title?.recommendations ?? []).slice(0, 3);

  const replay = () => {
    setEnded(false);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };

  return (
    <div className={styles.page}>
      <ResumeGate saved={saved} title={name} backdrop={title?.backdrop}>
        {startAt => (
          <VideoPlayer
            ref={videoRef}
            source={sourceFor(url, ext)}
            startAt={startAt}
            heading={name}
            mediaTitle={name}
            mediaArtist="Marcondes de Oxóssi"
            artwork={img(title?.poster)}
            poster={img(title?.backdrop, "w1280")}
            onBack={back}
            onTime={tracker.onTime}
            onPause={tracker.onPause}
            onSeeked={tracker.onSeeked}
            onEnded={() => {
              tracker.onEnded();
              setEnded(true);
            }}
            errorExtra={<StreamFallback url={url} title={name} reason={fallbackReason(false, ext)} />}
          >
            {() =>
              ended && (
                <div className={styles.full} role="dialog" aria-label="Fim do filme">
                  <h2>{name}</h2>
                  <div className={styles.row}>
                    <button className="btn btn-light" onClick={replay} autoFocus>
                      <RotateCcw size={20} /> Assistir de novo
                    </button>
                    <button className="btn btn-ghost" onClick={back}>Voltar</button>
                  </div>
                  {recs.length > 0 && (
                    <>
                      <p style={{ color: "var(--text-2)", fontWeight: 700 }}>Na mesma categoria</p>
                      <div className={styles.recs}>
                        {recs.map(r => (
                          <button
                            key={r.key}
                            className={styles.rec}
                            onClick={() => navigate(hrefs.watch("movie", r.id), { replace: true })}
                            aria-label={`Assistir ${r.title}`}
                          >
                            <Artwork path={r.poster} kind="poster" title={r.title} sizes="180px" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            }
          </VideoPlayer>
        )}
      </ResumeGate>
    </div>
  );
}

// ---------- Série ----------

/** Próximo episódio pela lista real (os números do painel podem pular). */
function useNextEpisode(id: number, show: TitleDetails | undefined, season: number, episodes: Episode[] | undefined, current: Episode | undefined) {
  const idx = current && episodes ? episodes.findIndex(x => x.episode === current.episode) : -1;
  const inSeason = idx >= 0 ? episodes![idx + 1] : undefined;
  const nextSeason = !inSeason && idx >= 0
    ? (show?.seasons ?? []).filter(x => x.number > season && x.episodeCount > 0).sort((a, b) => a.number - b.number)[0]?.number
    : undefined;
  const { data: nextSeasonEps } = useSeason(id, nextSeason ?? -1);
  return inSeason ?? (nextSeason !== undefined ? nextSeasonEps?.[0] : undefined);
}

export function XtSeriesPlayer() {
  const { id: idStr, temporada, episodio } = useParams();
  const id = Number(idStr);
  const s = Number(temporada);
  const e = Number(episodio);
  const navigate = useNavigate();
  const hrefs = useHrefs();
  const acc = useXtreamAccount();

  const { data: show, isError } = useTitle("tv", id);
  const { data: episodes, isError: epsError } = useSeason(id, s);
  const ep = episodes?.find(x => x.episode === e);
  const next = useNextEpisode(id, show, s, episodes, ep);

  const autoChain = useRef(0);
  const back = useBack(hrefs.details("tv", id));
  useDocumentTitle(show ? `${show.title} · T${s}:E${e}` : null);

  const goTo = useCallback(
    (season: number, episode: number) => navigate(hrefs.episode(id, season, episode), { replace: true }),
    [id, navigate, hrefs],
  );

  if (!acc) return <Navigate to="/" replace />;
  if (isError || epsError) return <Navigate to={hrefs.details("tv", id)} replace />;
  if (!show || !episodes) return <PlayerSkeleton />;

  // Número que não existe no painel: vai para o mais próximo
  if (!ep) {
    const near = episodes.find(x => x.episode >= e) ?? episodes[0];
    return near ? <Navigate to={hrefs.episode(id, s, near.episode)} replace /> : <Navigate to={hrefs.details("tv", id)} replace />;
  }

  const url = episodeUrl(acc, ep.streamId ?? "", ep.container);
  const epLabel = `T${s}:E${e}${ep.title ? ` · ${ep.title}` : ""}`;
  if (isMixedContent(url)) {
    return (
      <ExternalOnly
        title={show.title}
        subtitle={epLabel}
        url={url}
        backdrop={ep.still ?? show.backdrop}
        reason={fallbackReason(true)}
        onBack={back}
      />
    );
  }

  return (
    <div className={styles.page}>
      <EpisodeSession
        key={`${s}-${e}`}
        show={show}
        id={id}
        season={s}
        episode={e}
        ep={ep}
        source={sourceFor(url, ep.container)}
        next={next}
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
  autoChain,
  goTo,
  back,
}: {
  show: TitleDetails;
  id: number;
  season: number;
  episode: number;
  ep: Episode;
  source: VideoSource;
  next: Episode | undefined;
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

  const tracker = useProgressTracker(
    {
      kind: "episode",
      id,
      season: s,
      episode: e,
      meta: { title: show.title, poster: show.poster, backdrop: show.backdrop, episodeTitle: ep.title, still: ep.still },
    },
    NS,
  );

  const userActivity = useCallback(() => {
    autoChain.current = 0;
  }, [autoChain]);

  const playNext = () => {
    if (next) goTo(next.season, next.episode);
  };

  const autoAdvance = () => {
    if (!next) return;
    // Proteção contra maratona esquecida
    if (autoChain.current >= MAX_AUTOPLAY_CHAIN) {
      videoRef.current?.pause();
      setStillWatching(true);
      return;
    }
    autoChain.current += 1;
    playNext();
  };

  const name = show.title;
  const epLabel = `T${s}:E${e}${ep.title ? ` · ${ep.title}` : ""}`;

  return (
    <ResumeGate saved={progress?.episodes[`s${s}e${e}`]} title={name} subtitle={epLabel} backdrop={ep.still ?? show.backdrop}>
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
          mediaTitle={ep.title}
          mediaArtist={name}
          artwork={img(show.poster)}
          poster={img(ep.still ?? show.backdrop, "w1280")}
          onBack={back}
          onUserActivity={userActivity}
          onTime={tracker.onTime}
          onPause={tracker.onPause}
          onSeeked={tracker.onSeeked}
          onEnded={() => {
            tracker.onEnded();
            if (prefs.autoplayNext && !dismissedNext) autoAdvance();
          }}
          onNext={next ? () => { userActivity(); playNext(); } : undefined}
          errorExtra={<StreamFallback url={source.url} title={`${name} ${epLabel}`} reason={fallbackReason(false, ep.container)} />}
          extraControls={
            <>
              {next && (
                <button
                  className={styles.ctrl}
                  onClick={() => { userActivity(); playNext(); }}
                  aria-label="Próximo episódio"
                  title="Próximo episódio (N)"
                >
                  <SkipForward size={26} fill="currentColor" />
                </button>
              )}
              {show.seasons && show.seasons.length > 0 && (
                <button className={styles.ctrl} onClick={() => setPanel(p => !p)} aria-label="Episódios" aria-expanded={panel}>
                  <ListVideo size={26} />
                </button>
              )}
            </>
          }
        >
          {({ current, duration }) => {
            // Sem marcadores no IPTV: o card aparece nos últimos 30 s
            const inCredits = duration > 0 && duration - current <= 30;
            return (
              <>
                {inCredits && next && !dismissedNext && !stillWatching && !panel && (
                  <NextEpisodeCard
                    label={`T${next.season}:E${next.episode}${next.title ? ` · ${next.title}` : ""}`}
                    still={next.still}
                    available
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
                {panel && show.seasons && (
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

/** /pai-marcondes/assistir/serie/:id → episódio salvo, o seguinte, ou o primeiro da série. */
export function XtSeriesEntry() {
  const id = Number(useParams().id);
  const hrefs = useHrefs();
  const { data: show, isError } = useTitle("tv", id);
  const progress = useSeriesProgress(id);
  const first = show?.seasons?.[0]?.number;
  const { data: firstEps, isError: epsError } = useSeason(id, first ?? -1);

  if (isError || epsError || (show && !show.seasons?.length)) return <Navigate to={hrefs.details("tv", id)} replace />;

  if (progress) {
    const { season, episode } = progress.current;
    const cur = progress.episodes[`s${season}e${episode}`];
    if (cur && !cur.completed) return <Navigate to={hrefs.episode(id, season, episode)} replace />;
    if (!show) return <PlayerSkeleton />;
    // O player acerta números que faltam no painel
    const n = show.seasons ? nextEpisode(show.seasons, season, episode) : null;
    if (n) return <Navigate to={hrefs.episode(id, n.season, n.episode)} replace />;
  }
  if (!show || first === undefined || !firstEps) return <PlayerSkeleton />;
  const ep = firstEps[0];
  if (!ep) return <Navigate to={hrefs.details("tv", id)} replace />;
  return <Navigate to={hrefs.episode(id, first, ep.episode)} replace />;
}
