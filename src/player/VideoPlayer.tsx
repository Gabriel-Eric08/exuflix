import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from "react";
import type HlsType from "hls.js";
import type { VideoSource } from "./sources";
import { usePreferences } from "../storage/preferences";
import { usePlayerKeyboard } from "../hooks/usePlayerKeyboard";
import { Controls, type MenuOption } from "./Controls";
import { Symbol } from "../components/Logo";
import { Play, RotateCcw, RotateCw } from "lucide-react";
import styles from "./Player.module.css";

export interface PlayerState {
  current: number;
  duration: number;
  playing: boolean;
  controlsVisible: boolean;
}

interface Props {
  source: VideoSource;
  startAt?: number;
  autoPlay?: boolean;
  /** Conteúdo do topo (título; série: "Nome · T2:E5 · Episódio") */
  heading: ReactNode;
  mediaTitle: string;
  mediaArtist?: string;
  artwork?: string | null;
  poster?: string | null;
  onBack: () => void;
  onTime?: (t: number, d: number) => void;
  onPause?: (t: number, d: number) => void;
  onSeeked?: (t: number, d: number) => void;
  onEnded?: () => void;
  /** Interação explícita do usuário (para a proteção contra maratona esquecida) */
  onUserActivity?: () => void;
  extraControls?: ReactNode;
  onNext?: () => void;
  onSkipIntro?: () => void;
  children?: (s: PlayerState) => ReactNode;
  /** TV ao vivo: sem linha do tempo nem atalhos de avançar/voltar */
  live?: boolean;
  /** Conteúdo extra na tela de erro (ex.: abrir no VLC) */
  errorExtra?: ReactNode;
}

const HIDE_AFTER = 3000;
const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const VideoPlayer = forwardRef<HTMLVideoElement, Props>(function VideoPlayer(
  {
    source,
    startAt = 0,
    autoPlay = true,
    heading,
    mediaTitle,
    mediaArtist,
    artwork,
    poster,
    onBack,
    onTime,
    onPause,
    onSeeked,
    onEnded,
    onUserActivity,
    extraControls,
    onNext,
    onSkipIntro,
    children,
    live = false,
    errorExtra,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  useImperativeHandle(ref, () => videoRef.current!);

  const [prefs, setPrefs] = usePreferences();
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(startAt);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(prefs.volume);
  const [muted, setMuted] = useState(prefs.muted);
  const [rate, setRate] = useState(prefs.playbackRate);
  const [waiting, setWaiting] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [subtitle, setSubtitle] = useState<string | null>(
    source.subtitles?.some(s => s.lang === prefs.subtitleLang) ? prefs.subtitleLang : null,
  );
  const [levels, setLevels] = useState<MenuOption[]>([]);
  const [level, setLevel] = useState(-1);
  const [audioTracks, setAudioTracks] = useState<MenuOption[]>([]);
  const [audioTrack, setAudioTrack] = useState(0);
  const [ripple, setRipple] = useState<{ side: "left" | "right"; id: number } | null>(null);

  // ---------- Carrega a fonte (HLS nativo no Safari, hls.js no resto) ----------
  useEffect(() => {
    const video = videoRef.current!;
    let cancelled = false;
    setError(null);
    setLevels([]);
    setAudioTracks([]);
    const resumeAt = attempt > 0 ? video.currentTime || startAt : startAt;

    (async () => {
      if (source.kind === "hls" && !video.canPlayType("application/vnd.apple.mpegurl")) {
        const { default: Hls } = await import("hls.js");
        if (cancelled) return;
        if (!Hls.isSupported()) return setError("Seu navegador não suporta este vídeo.");
        const hls = new Hls({ startPosition: resumeAt > 0 ? resumeAt : -1 });
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLevels(
            hls.levels
              .map((l, i) => ({ value: i, label: l.height ? `${l.height}p` : `${Math.round(l.bitrate / 1000)} kbps` }))
              .reverse(),
          );
        });
        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
          setAudioTracks(hls.audioTracks.map((t, i) => ({ value: i, label: t.name || t.lang || `Faixa ${i + 1}` })));
          const pref = prefsRef.current.audioLang;
          const idx = pref ? hls.audioTracks.findIndex(t => t.lang === pref) : -1;
          if (idx >= 0) hls.audioTrack = idx;
          setAudioTrack(hls.audioTrack);
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, () => setLevel(hls.autoLevelEnabled ? -1 : hls.currentLevel));
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else setError("A conexão tropeçou. Tentar de novo?");
        });
        hls.loadSource(source.url);
        hls.attachMedia(video);
      } else {
        video.src = source.url;
        const seek = () => {
          if (resumeAt > 0) video.currentTime = resumeAt;
        };
        video.addEventListener("loadedmetadata", seek, { once: true });
      }
      const p = prefsRef.current;
      video.volume = p.volume;
      video.muted = p.muted;
      video.playbackRate = p.playbackRate;
      if (autoPlay) video.play().catch(() => setPlaying(false)); // autoplay bloqueado: mostra botão play
    })();

    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.removeAttribute("src");
      video.load();
    };
  }, [source.url, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Legendas ----------
  useEffect(() => {
    const video = videoRef.current!;
    const apply = () => {
      for (const t of Array.from(video.textTracks)) {
        t.mode = subtitle && t.language === subtitle ? "showing" : "disabled";
      }
    };
    apply();
    video.textTracks.addEventListener?.("addtrack", apply);
    return () => video.textTracks.removeEventListener?.("addtrack", apply);
  }, [subtitle, source.url]);

  // ---------- Controles somem após 3 s sem movimento ----------
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const activity = useCallback(() => {
    setVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setVisible(false);
    }, HIDE_AFTER);
  }, []);
  useEffect(() => {
    if (!playing) {
      clearTimeout(hideTimer.current);
      setVisible(true);
    } else activity();
  }, [playing, activity]);
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // ---------- Buffering: spinner só após 400 ms de "waiting" ----------
  const waitTimer = useRef<ReturnType<typeof setTimeout>>();
  const startWaiting = () => {
    clearTimeout(waitTimer.current);
    waitTimer.current = setTimeout(() => setWaiting(true), 400);
  };
  const stopWaiting = () => {
    clearTimeout(waitTimer.current);
    setWaiting(false);
  };

  // ---------- Volume salvo com debounce de 300 ms ----------
  const volTimer = useRef<ReturnType<typeof setTimeout>>();
  const onVolumeChange = () => {
    const v = videoRef.current!;
    setVolume(v.volume);
    setMuted(v.muted);
    clearTimeout(volTimer.current);
    volTimer.current = setTimeout(() => setPrefs(p => ({ ...p, volume: v.volume, muted: v.muted })), 300);
  };

  // ---------- Tela cheia ----------
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ---------- Ações ----------
  const v = () => videoRef.current!;
  const togglePlay = () => {
    onUserActivity?.();
    if (v().paused) v().play().catch(() => {});
    else v().pause();
  };
  const seekTo = (t: number) => {
    const d = v().duration || 0;
    v().currentTime = Math.min(Math.max(0, t), d ? d - 0.1 : t);
    setCurrent(v().currentTime);
    onUserActivity?.();
  };
  const seekBy = (s: number) => seekTo(v().currentTime + s);
  const setVol = (x: number) => {
    v().volume = Math.min(1, Math.max(0, x));
    if (v().volume > 0) v().muted = false;
  };
  const toggleMute = () => (v().muted = !v().muted);
  const toggleFullscreen = () => {
    const el = containerRef.current!;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else (v() as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen?.(); // iOS
  };
  const togglePip = () => {
    if (!document.pictureInPictureEnabled) return;
    if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
    else v().requestPictureInPicture().catch(() => {});
  };
  const chooseSubtitle = (lang: string | null) => {
    setSubtitle(lang);
    setPrefs(p => ({ ...p, subtitleLang: lang }));
  };
  const toggleSubtitles = () => {
    const first = source.subtitles?.[0]?.lang ?? null;
    if (!first) return;
    chooseSubtitle(subtitle ? null : prefs.subtitleLang && source.subtitles!.some(s => s.lang === prefs.subtitleLang) ? prefs.subtitleLang : first);
  };
  const chooseRate = (r: number) => {
    v().playbackRate = r;
    setRate(r);
    setPrefs(p => ({ ...p, playbackRate: r }));
  };
  const chooseLevel = (i: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = i; // -1 = automático
    setLevel(i);
  };
  const chooseAudio = (i: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.audioTrack = i;
    setAudioTrack(i);
    setPrefs(p => ({ ...p, audioLang: hls.audioTracks[i]?.lang ?? null }));
  };

  usePlayerKeyboard({
    togglePlay,
    seekBy: live ? () => {} : seekBy,
    seekToFraction: f => { if (!live) seekTo((v().duration || 0) * f); },
    volumeBy: d => setVol(v().volume + d),
    toggleMute,
    toggleFullscreen,
    toggleSubtitles,
    togglePip,
    escape: () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else onBack();
    },
    next: onNext,
    skipIntro: onSkipIntro,
    activity: () => {
      activity();
      onUserActivity?.();
    },
  });

  // ---------- Media Session (controles do sistema e fones) ----------
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: mediaTitle,
      artist: mediaArtist ?? "Exuflix",
      artwork: artwork ? [{ src: artwork, sizes: "500x750", type: "image/jpeg" }] : [],
    });
    const ms = navigator.mediaSession;
    const set = (a: MediaSessionAction, h: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(a, h);
      } catch {
        /* ação não suportada */
      }
    };
    set("play", () => v().play());
    set("pause", () => v().pause());
    set("seekbackward", d => seekBy(-(d.seekOffset ?? 10)));
    set("seekforward", d => seekBy(d.seekOffset ?? 10));
    set("seekto", d => d.seekTime !== undefined && seekTo(d.seekTime));
    set("nexttrack", onNext ?? null);
    return () => {
      (["play", "pause", "seekbackward", "seekforward", "seekto", "nexttrack"] as MediaSessionAction[]).forEach(a => set(a, null));
    };
  }, [mediaTitle, mediaArtist, artwork, onNext]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Toque: 1 toque mostra/esconde controles; 2 toques nas laterais = ±10 s ----------
  const pointerType = useRef("mouse");
  const lastTap = useRef<{ t: number; side: "left" | "right" | "center" } | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout>>();
  const onStagePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return; // mouse usa onClick
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const side = x < 0.35 ? "left" : x > 0.65 ? "right" : "center";
    const now = Date.now();
    if (lastTap.current && now - lastTap.current.t < 300 && side !== "center" && lastTap.current.side === side) {
      clearTimeout(tapTimer.current);
      seekBy(side === "left" ? -10 : 10);
      setRipple({ side, id: now });
      lastTap.current = { t: now, side }; // permite toques triplos acumularem
      return;
    }
    lastTap.current = { t: now, side };
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      if (visible && playing) {
        clearTimeout(hideTimer.current);
        setVisible(false);
      } else activity();
    }, 300);
  };

  const subtitleOptions: MenuOption[] = (source.subtitles ?? []).map(s => ({ value: s.lang, label: s.label }));
  const state: PlayerState = { current, duration, playing, controlsVisible: visible };

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${visible ? styles.showControls : styles.hideCursor}`}
      onMouseMove={activity}
      onPointerDown={e => {
        onUserActivity?.();
        if (e.pointerType === "mouse") activity();
      }}
    >
      <video
        ref={videoRef}
        className={styles.video}
        playsInline
        poster={poster ?? undefined}
        // Só pede CORS quando há legenda de outro domínio; sem isso, CDNs sem CORS quebrariam o vídeo
        crossOrigin={source.subtitles?.some(s => /^https?:/.test(s.url)) ? "anonymous" : undefined}
        onPlay={() => setPlaying(true)}
        onPause={e => {
          setPlaying(false);
          onPause?.(e.currentTarget.currentTime, e.currentTarget.duration);
        }}
        onTimeUpdate={e => {
          const t = e.currentTarget.currentTime;
          const d = e.currentTarget.duration;
          setCurrent(t);
          onTime?.(t, d);
        }}
        onDurationChange={e => setDuration(e.currentTarget.duration || 0)}
        onProgress={e => {
          const b = e.currentTarget.buffered;
          setBuffered(b.length ? b.end(b.length - 1) : 0);
        }}
        onSeeked={e => onSeeked?.(e.currentTarget.currentTime, e.currentTarget.duration)}
        onWaiting={startWaiting}
        onPlaying={stopWaiting}
        onCanPlay={stopWaiting}
        onVolumeChange={onVolumeChange}
        onRateChange={e => setRate(e.currentTarget.playbackRate)}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
        onError={() => {
          if (source.kind === "mp4") setError("Não foi possível carregar o vídeo.");
        }}
      >
        {source.subtitles?.map(s => (
          <track key={s.lang} kind="subtitles" src={s.url} srcLang={s.lang} label={s.label} default={s.lang === subtitle} />
        ))}
      </video>

      {/* Camada de clique/toque sobre o vídeo */}
      <div
        className={styles.tapLayer}
        onPointerDown={e => (pointerType.current = e.pointerType)}
        onClick={() => { if (pointerType.current === "mouse") togglePlay(); }}
        onDoubleClick={() => { if (pointerType.current === "mouse") toggleFullscreen(); }}
        onPointerUp={onStagePointerUp}
      />

      {ripple && (
        <div key={ripple.id} className={`${styles.ripple} ${styles[ripple.side]}`} onAnimationEnd={() => setRipple(null)} aria-hidden>
          {ripple.side === "left" ? <RotateCcw size={28} /> : <RotateCw size={28} />}
          <span>{ripple.side === "left" ? "−10 s" : "+10 s"}</span>
        </div>
      )}

      {waiting && !error && (
        <div className={styles.spinner} role="status" aria-label="Carregando">
          <Symbol size={64} plate={false} />
        </div>
      )}

      {!playing && !error && !waiting && live && (
        <div className={styles.center}>
          <button className={styles.centerPlay} onClick={togglePlay} aria-label="Reproduzir">
            <Play size={36} fill="currentColor" />
          </button>
        </div>
      )}

      {!playing && !error && !waiting && !live && (
        <div className={styles.center}>
          <button className={styles.centerSkip} onClick={() => seekBy(-10)} aria-label="Voltar 10 segundos">
            <RotateCcw size={32} />
            <span>10</span>
          </button>
          <button className={styles.centerPlay} onClick={togglePlay} aria-label="Reproduzir">
            <Play size={36} fill="currentColor" />
          </button>
          <button className={styles.centerSkip} onClick={() => seekBy(10)} aria-label="Avançar 10 segundos">
            <RotateCw size={32} />
            <span>10</span>
          </button>
        </div>
      )}

      {error && (
        <div className={styles.error} role="alert">
          <p>{error}</p>
          <div>
            <button className="btn btn-primary" onClick={() => setAttempt(a => a + 1)}>Tentar de novo</button>
            <button className="btn btn-ghost" onClick={onBack}>Voltar</button>
          </div>
          {errorExtra}
        </div>
      )}

      {children?.(state)}

      <Controls
        heading={heading}
        live={live}
        onBack={onBack}
        playing={playing}
        current={current}
        duration={duration}
        buffered={buffered}
        volume={volume}
        muted={muted}
        fullscreen={fullscreen}
        rate={rate}
        rates={RATES}
        subtitle={subtitle}
        subtitleOptions={subtitleOptions}
        levels={levels}
        level={level}
        audioTracks={audioTracks}
        audioTrack={audioTrack}
        pip={typeof document !== "undefined" && document.pictureInPictureEnabled}
        onTogglePlay={togglePlay}
        onSeek={seekTo}
        onSeekBy={seekBy}
        onVolume={setVol}
        onToggleMute={toggleMute}
        onToggleFullscreen={toggleFullscreen}
        onTogglePip={togglePip}
        onSubtitle={chooseSubtitle}
        onRate={chooseRate}
        onLevel={chooseLevel}
        onAudio={chooseAudio}
        extra={extraControls}
        onMenuActivity={activity}
      />
    </div>
  );
});
