import { useEffect, useRef, useState, type ReactNode } from "react";
import { Play, RotateCcw } from "lucide-react";
import { img } from "../api/images";
import { resumePoint, shouldOfferResume } from "../storage/progress";
import { formatTime } from "./format";
import styles from "./Player.module.css";

const AUTO_CONTINUE_S = 8;

interface Saved {
  position: number;
  duration: number;
  completed: boolean;
}

/**
 * Decide uma única vez (ao montar) se pergunta "Continuar de 42:13 / Começar do início".
 * Ao retomar, volta 5 s antes do ponto salvo.
 */
export function ResumeGate({
  saved,
  title,
  subtitle,
  backdrop,
  children,
}: {
  saved: Saved | undefined;
  title: string;
  subtitle?: string;
  backdrop: string | null | undefined;
  children: (startAt: number) => ReactNode;
}) {
  const [initial] = useState(saved);
  const [startAt, setStartAt] = useState<number | null>(initial && shouldOfferResume(initial) ? null : 0);

  if (startAt === null && initial) {
    return (
      <ResumeDialog
        saved={initial}
        title={title}
        subtitle={subtitle}
        backdrop={backdrop}
        onResume={() => setStartAt(resumePoint(initial))}
        onRestart={() => setStartAt(0)}
      />
    );
  }
  return <>{children(startAt ?? 0)}</>;
}

function ResumeDialog({
  saved,
  title,
  subtitle,
  backdrop,
  onResume,
  onRestart,
}: {
  saved: Saved;
  title: string;
  subtitle?: string;
  backdrop: string | null | undefined;
  onResume: () => void;
  onRestart: () => void;
}) {
  const [left, setLeft] = useState(AUTO_CONTINUE_S);
  const resumeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => resumeRef.current?.focus(), []);
  useEffect(() => {
    if (left <= 0) return onResume();
    const id = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(id);
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = saved.duration ? (saved.position / saved.duration) * 100 : 0;

  return (
    <div className={styles.resume} role="dialog" aria-modal="true" aria-labelledby="resume-title">
      {backdrop && <img className={styles.resumeBg} src={img(backdrop, "w780")!} alt="" />}
      <div className={styles.resumeCard}>
        <div>
          <h1 id="resume-title">{title}</h1>
          {subtitle && <p style={{ color: "var(--text-2)", fontWeight: 600, marginTop: 4 }}>{subtitle}</p>}
        </div>
        <div className={styles.resumeBar} aria-hidden>
          <span style={{ width: `${pct}%` }} />
        </div>
        <button ref={resumeRef} className="btn btn-primary" onClick={onResume}>
          <Play size={20} fill="currentColor" /> Continuar de <span className="tabular">{formatTime(saved.position)}</span>
        </button>
        <button className="btn btn-outline" onClick={onRestart}>
          <RotateCcw size={20} /> Começar do início
        </button>
        <p className={styles.resumeHint} aria-live="polite">
          Continuando automaticamente em {left}s
        </p>
      </div>
    </div>
  );
}
