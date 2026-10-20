import { useRef, useState } from "react";
import { formatTime, spokenTime } from "./format";
import styles from "./Player.module.css";

interface Props {
  current: number;
  duration: number;
  buffered: number;
  onSeek: (t: number) => void;
  markers?: { introStart?: number; introEnd?: number };
}

/** Barra de progresso: 4 px → 8 px no hover, tooltip de tempo, arrastável e acessível. */
export function ProgressBar({ current, duration, buffered, onSeek }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; t: number } | null>(null);
  const [drag, setDrag] = useState<number | null>(null);

  const timeAt = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return { x: f * r.width, t: f * (duration || 0) };
  };

  const shown = drag ?? current;
  const pct = duration ? (shown / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={ref}
      className={`${styles.progress} ${drag !== null ? styles.dragging : ""}`}
      role="slider"
      tabIndex={0}
      aria-label="Posição do vídeo"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration || 0)}
      aria-valuenow={Math.round(shown)}
      aria-valuetext={spokenTime(shown, duration || 0)}
      onPointerDown={e => {
        if (!duration) return;
        (e.target as Element).setPointerCapture(e.pointerId);
        setDrag(timeAt(e.clientX).t);
      }}
      onPointerMove={e => {
        if (!duration) return;
        const h = timeAt(e.clientX);
        setHover(h);
        if (drag !== null) setDrag(h.t);
      }}
      onPointerUp={e => {
        if (drag !== null) onSeek(timeAt(e.clientX).t);
        setDrag(null);
      }}
      onPointerCancel={() => setDrag(null)}
      onPointerLeave={() => setHover(null)}
    >
      <div className={styles.track}>
        <div className={styles.buffer} style={{ width: `${bufPct}%` }} />
        <div className={styles.played} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.thumb} style={{ left: `${pct}%` }} />
      {hover && (
        <div className={`${styles.tooltip} tabular`} style={{ left: hover.x }}>
          {formatTime(drag ?? hover.t)}
        </div>
      )}
    </div>
  );
}
