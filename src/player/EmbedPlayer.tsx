import { useEffect } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { hasEnterpriseConfigured } from "./embed";
import styles from "./Player.module.css";

interface Props {
  src: string;
  title: string;
  subtitle?: string;
  onBack: () => void;
  children?: React.ReactNode;
}

export function EmbedPlayer({ src, title, subtitle, onBack, children }: Props) {
  const isConfigured = hasEnterpriseConfigured();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  return (
    <div className={styles.embedPage}>
      <header className={styles.embedHeader}>
        <div className={styles.embedHeaderLeft}>
          <button className={styles.embedBackBtn} onClick={onBack} aria-label="Voltar">
            <ArrowLeft size={18} />
            <span>Voltar</span>
          </button>
          <div className={styles.embedTitleWrap}>
            <span className={styles.embedTitle}>{title}</span>
            {subtitle && <span className={styles.embedSubtitle}>{subtitle}</span>}
          </div>
        </div>
        {children && <div className={styles.embedHeaderRight}>{children}</div>}
      </header>

      <main className={styles.embedContainer}>
        {isConfigured ? (
          <iframe
            src={src}
            title={title}
            className={styles.embedIframe}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <div className={styles.embedWarning}>
            <AlertCircle size={48} color="var(--exu-red-500)" />
            <h3>URL_ENTERPRISE não configurada</h3>
            <p>
              Defina a variável <code>URL_ENTERPRISE</code> no seu arquivo <code>.env</code> para carregar o player embed da sua empresa.
            </p>
            <button className="btn btn-primary" onClick={onBack} style={{ marginTop: 12 }}>
              Voltar ao catálogo
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

