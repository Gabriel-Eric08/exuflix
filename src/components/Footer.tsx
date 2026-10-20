import { Link } from "react-router-dom";
import { Wordmark } from "./Logo";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <Wordmark className={styles.wordmark} />
        <p className={styles.tagline}>Toda história passa por aqui.</p>
      </div>
      <nav className={styles.links} aria-label="Rodapé">
        <Link to="/series">Séries</Link>
        <Link to="/filmes">Filmes</Link>
        <Link to="/categorias">Categorias</Link>
        <Link to="/minha-lista">Minha lista</Link>
        <Link to="/sobre">Sobre e configurações</Link>
      </nav>
      <div className={styles.tmdb}>
        <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" aria-label="The Movie Database">
          <TmdbLogo />
        </a>
        <p>Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.</p>
      </div>
    </footer>
  );
}

/** Marca do TMDB (texto com o gradiente da marca). Troque pelo SVG oficial de themoviedb.org/about/logos-attribution. */
export function TmdbLogo({ height = 14 }: { height?: number }) {
  return (
    <svg height={height} viewBox="0 0 64 16" aria-hidden>
      <defs>
        <linearGradient id="tmdb-g" x1="0" x2="1">
          <stop offset="0" stopColor="#90cea1" />
          <stop offset="0.56" stopColor="#3cbec9" />
          <stop offset="1" stopColor="#01b4e4" />
        </linearGradient>
      </defs>
      <rect width="64" height="16" rx="8" fill="url(#tmdb-g)" />
      <text x="32" y="12" textAnchor="middle" fontFamily="Manrope, sans-serif" fontWeight="800" fontSize="11" fill="#0d253f">
        TMDB
      </text>
    </svg>
  );
}
