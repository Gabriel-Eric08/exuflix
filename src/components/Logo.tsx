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
