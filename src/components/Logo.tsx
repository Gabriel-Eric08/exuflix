import styles from "./Logo.module.css";

/** Wordmark EXUFLIX: os dois X em vermelho são a encruzilhada. */
export function Wordmark({ className = "", mono = false }: { className?: string; mono?: boolean }) {
  return (
    <span className={`${styles.wordmark} ${mono ? styles.mono : ""} ${className}`} aria-label="Exuflix">
      <span aria-hidden>
        E<span className={styles.x}>X</span>UFLI<span className={styles.x}>X</span>
      </span>
    </span>
  );
}

/** Símbolo "X" com ponto dourado. `animated` desenha os traços (splash/loading). */
export function Symbol({ size = 32, animated = false, plate = true }: { size?: number; animated?: boolean; plate?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={animated ? styles.animated : undefined}
      aria-hidden
    >
      {plate && <rect width="64" height="64" rx="14" fill="#0B0A0A" />}
      <g stroke="var(--exu-red-500)" strokeWidth="10" strokeLinecap="butt" fill="none">
        <path className={styles.stroke1} d="M17 17 47 47" pathLength={1} />
        <path className={styles.stroke2} d="M47 17 17 47" pathLength={1} />
      </g>
      <circle className={styles.dot} cx="32" cy="32" r="3.9" fill="var(--gold-400)" />
    </svg>
  );
}

export function Splash() {
  return (
    <div className={styles.splash} role="status" aria-label="Carregando">
      <Symbol size={72} animated plate={false} />
    </div>
  );
}

/** Wordmark da área IPTV: "MARCONDES" + "de Oxóssi" em verde. */
export function XtWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`${styles.wordmark} ${styles.xt} ${className}`} aria-label="Marcondes de Oxóssi">
      <span aria-hidden>
        MARCONDES <span className={styles.xtSub}>de Oxóssi</span>
      </span>
    </span>
  );
}

/** Ofá (arco e flecha de Oxóssi). */
export function XtSymbol({ size = 32, plate = true }: { size?: number; plate?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      {plate && <rect width="64" height="64" rx="14" fill="#0B0A0A" />}
      <g fill="none" stroke="var(--oxossi-400)" strokeWidth="5" strokeLinecap="round">
        <path d="M18 14c22 4 32 14 36 36" />
        <path d="M18 14 54 50" strokeWidth="2.5" />
      </g>
      <path d="M12 52 44 20" stroke="var(--gold-400)" strokeWidth="4" strokeLinecap="round" />
      <path d="M44 20h-9m9 0v9" stroke="var(--gold-400)" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}
