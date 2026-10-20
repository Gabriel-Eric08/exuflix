export { PlayerSkeleton } from "./PlayerSkeleton";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Season } from "../api/types";
import { img } from "../api/images";
import { EpisodeList, SeasonSelect } from "../components/EpisodeList";
import styles from "./Player.module.css";

/** "Pular abertura": visível entre introStart e introEnd; some 5 s depois de aparecer (volta com os controles). */
export function SkipIntroButton({
  markers,
  current,
  controlsVisible,
  onSkip,
}: {
  markers?: { introStart?: number; introEnd?: number };
  current: number;
  controlsVisible: boolean;
  onSkip: () => void;
}) {
  const start = markers?.introStart;
  const end = markers?.introEnd;
  const inIntro = start !== undefined && end !== undefined && current >= start && current < end;
  const [appearedAt, setAppearedAt] = useState<number | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    if (inIntro && appearedAt === null) setAppearedAt(Date.now());
    if (!inIntro && appearedAt !== null) setAppearedAt(null);
  }, [inIntro, appearedAt]);
  useEffect(() => {
    if (appearedAt === null) return;
    const id = setTimeout(() => force(n => n + 1), 5000);
    return () => clearTimeout(id);
  }, [appearedAt]);

  const fresh = appearedAt !== null && Date.now() - appearedAt < 5000;
  if (!inIntro || !(fresh || controlsVisible)) return null;
  return (
    <button className={styles.skipIntro} onClick={onSkip} aria-label="Pular abertura">
      Pular abertura
    </button>
  );
}

/** Painel lateral (desktop) / bottom sheet (mobile) de episódios. */
export function EpisodePanel({
  tvId,
  seasons,
  current,
  onPick,
  onClose,
}: {
  tvId: number;
  seasons: Season[];
  current: { season: number; episode: number };
  onPick: (s: number, e: number) => void;
  onClose: () => void;
}) {
  const [season, setSeason] = useState(current.season);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [onClose]);

  return (
    <aside ref={ref} className={styles.panel} aria-label="Episódios" tabIndex={-1} onPointerDown={e => e.stopPropagation()}>
      <div className={styles.panelHead}>
        <h2>Episódios</h2>
        <SeasonSelect seasons={seasons} value={season} onChange={setSeason} />
        <button className="icon-btn" onClick={onClose} aria-label="Fechar episódios">
          <X size={18} />
        </button>
      </div>
      <div className={styles.panelBody}>
        <EpisodeList tvId={tvId} season={season} current={current} onPick={onPick} compact />
      </div>
    </aside>
  );
}

const COUNTDOWN = 10;

/** Card de próximo episódio nos créditos, com contagem regressiva de 10 s. */
export function NextEpisodeCard({
  label,
  still,
  available,
  autoplay,
  onPlay,
  onDismiss,
}: {
  label: string;
  still: string | null | undefined;
  available: boolean;
  autoplay: boolean;
  onPlay: (auto: boolean) => void;
  onDismiss: () => void;
}) {
  const [left, setLeft] = useState(COUNTDOWN);
  const run = autoplay && available;

  useEffect(() => {
    if (!run) return;
    if (left <= 0) return onPlay(true);
    const id = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(id);
  }, [left, run]); // eslint-disable-line react-hooks/exhaustive-deps

  const r = 22;
  const c = 2 * Math.PI * r;

  return (
    <div className={styles.overlayCard} role="region" aria-label="Próximo episódio" onPointerDown={e => e.stopPropagation()}>
      {still && <img src={img(still, "w300")!} alt="" style={{ aspectRatio: "16 / 9", width: "100%", objectFit: "cover" }} />}
      <div className={styles.overlayCardBody}>
        <div>
          <small>{available ? (run ? `Próximo episódio em ${left}s` : "Próximo episódio") : "Próximo episódio ainda não disponível"}</small>
          <p>{label}</p>
        </div>
        <div className={styles.overlayActions}>
          {available && (
            <button className="btn btn-light" onClick={() => onPlay(false)} autoFocus>
              {run && (
                <span className={styles.countdown} aria-hidden>
                  <svg width="52" height="52" viewBox="0 0 52 52" style={{ width: 20, height: 20, inset: 0, position: "relative" }}>
                    <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(11,10,10,.2)" strokeWidth="6" />
                    <circle
                      cx="26"
                      cy="26"
                      r={r}
                      fill="none"
                      stroke="var(--exu-red-500)"
                      strokeWidth="6"
                      strokeDasharray={c}
                      strokeDashoffset={c * (1 - left / COUNTDOWN)}
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                  </svg>
                </span>
              )}
              Assistir agora
            </button>
          )}
          <button className="btn btn-ghost" onClick={onDismiss}>
            Ver créditos
          </button>
        </div>
      </div>
    </div>
  );
}
