import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, X, Home, Tv, Clapperboard, Bookmark, LayoutGrid, Lock, Radio, UserRound } from "lucide-react";
import { XT_BASE } from "../app/routes";
import { useCatalog, useHrefs } from "../catalog/CatalogContext";
import { useXtreamAccount } from "../xtream/credentials";
import { openAccount, openLogin } from "../xtream/LoginModal";
import { Symbol, Wordmark, XtSymbol, XtWordmark } from "./Logo";
import styles from "./Navbar.module.css";

const LINKS = [
  { to: "/", label: "Início", icon: Home, end: true },
  { to: "/series", label: "Séries", icon: Tv },
  { to: "/filmes", label: "Filmes", icon: Clapperboard },
  { to: "/categorias", label: "Categorias", icon: LayoutGrid },
  { to: "/minha-lista", label: "Minha lista", icon: Bookmark },
];

const XT_LINKS = [
  { to: XT_BASE, label: "Início", icon: Home, end: true },
  { to: `${XT_BASE}/ao-vivo`, label: "Ao vivo", icon: Radio },
  { to: `${XT_BASE}/series`, label: "Séries", icon: Tv },
  { to: `${XT_BASE}/filmes`, label: "Filmes", icon: Clapperboard },
  { to: `${XT_BASE}/categorias`, label: "Categorias", icon: LayoutGrid },
  { to: `${XT_BASE}/minha-lista`, label: "Minha lista", icon: Bookmark },
];

const XT_LABEL = "Marcondes de Oxóssi";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const catalog = useCatalog();
  const xt = catalog.id === "xtream";
  const account = useXtreamAccount();
  const links = xt ? XT_LINKS : LINKS;
  const searchPath = `${catalog.base}/busca`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={`${styles.nav} ${scrolled ? styles.scrolled : ""} ${xt ? styles.xt : ""}`}>
        {xt ? (
          <Link to={XT_BASE} className={styles.brand} aria-label={`${XT_LABEL}, início`}>
            <XtWordmark className={styles.wordmark} />
            <span className={styles.symbol}>
              <XtSymbol size={30} plate={false} />
            </span>
          </Link>
        ) : (
          <Link to="/" className={styles.brand} aria-label="Exuflix, início">
            <Wordmark className={styles.wordmark} />
            <span className={styles.symbol}>
              <Symbol size={30} plate={false} />
            </span>
          </Link>
        )}
        <nav className={styles.links} aria-label="Principal">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? styles.active : undefined)}>
              {l.label}
            </NavLink>
          ))}
          {xt ? (
            <Link to="/" className={styles.switch}>
              <Symbol size={18} plate={false} /> Exuflix
            </Link>
          ) : account ? (
            <Link to={XT_BASE} className={styles.switch}>
              <XtSymbol size={18} plate={false} /> {XT_LABEL}
            </Link>
          ) : (
            <button
              type="button"
              className={`${styles.switch} ${styles.locked}`}
              data-locked="true"
              onClick={openLogin}
              title="Conecte uma lista IPTV para liberar"
              aria-label={`${XT_LABEL} (bloqueado: conectar IPTV)`}
            >
              <XtSymbol size={18} plate={false} /> {XT_LABEL} <Lock size={12} aria-hidden />
            </button>
          )}
        </nav>
        <SearchBox key={location.pathname === searchPath ? "search" : "other"} base={catalog.base} placeholder={xt ? "Filmes, séries e canais" : undefined} />
        {xt && (
          <button className={styles.account} onClick={openAccount} aria-label="Conta IPTV" title="Conta IPTV">
            <UserRound size={22} />
          </button>
        )}
      </header>

      <nav className={styles.tabbar} aria-label="Navegação inferior">
        {links
          .filter(l => !l.to.endsWith("/categorias"))
          .flatMap(l => (l.to.endsWith("/minha-lista") ? [{ to: searchPath, label: "Busca", icon: Search }, l] : [l]))
          .map(l => (
            <NavLink key={l.to} to={l.to} end={"end" in l ? l.end : false} className={({ isActive }) => (isActive ? styles.tabActive : undefined)}>
              <l.icon size={22} aria-hidden />
              <span>{l.label}</span>
            </NavLink>
          ))}
        {!xt &&
          (account ? (
            <Link to={XT_BASE}>
              <XtSymbol size={22} plate={false} />
              <span>Oxóssi</span>
            </Link>
          ) : (
            <button type="button" className={styles.locked} data-locked="true" onClick={openLogin} aria-label={`${XT_LABEL} (bloqueado: conectar IPTV)`}>
              <XtSymbol size={22} plate={false} />
              <span>Oxóssi</span>
            </button>
          ))}
      </nav>
    </>
  );
}

function SearchBox({ base, placeholder = "Títulos, gente, gêneros" }: { base: string; placeholder?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const hrefs = useHrefs();
  const [params] = useSearchParams();
  const searchPath = `${base}/busca`;
  const onSearchPage = location.pathname === searchPath;
  const [open, setOpen] = useState(onSearchPage);
  const [value, setValue] = useState(onSearchPage ? params.get("q") ?? "" : "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Atalho "/" foca a busca em qualquer página
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== "/" || el.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      if (window.matchMedia("(max-width: 767px)").matches) return navigate(searchPath);
      setOpen(true);
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, searchPath]);

  // Debounce de 300 ms: a URL é a fonte da verdade da página de busca
  useEffect(() => {
    if (!open) return;
    const q = value.trim();
    if (!onSearchPage && !q) return;
    const id = setTimeout(() => {
      if (q === (params.get("q") ?? "") && onSearchPage) return;
      navigate(q ? `${searchPath}?q=${encodeURIComponent(q)}` : searchPath, { replace: onSearchPage });
    }, 300);
    return () => clearTimeout(id);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    setValue("");
    setOpen(false);
    if (onSearchPage) navigate(hrefs.to("/"));
  };

  return (
    <div className={`${styles.search} ${open ? styles.searchOpen : ""}`}>
      <button
        className={styles.searchBtn}
        aria-label="Buscar"
        onClick={() => {
          if (window.matchMedia("(max-width: 767px)").matches) return navigate(searchPath);
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
      >
        <Search size={22} />
      </button>
      <input
        ref={inputRef}
        className={styles.input}
        type="search"
        placeholder={placeholder}
        aria-label="Buscar títulos"
        value={value}
        tabIndex={open ? 0 : -1}
        onChange={e => setValue(e.target.value)}
        onBlur={() => { if (!value) setOpen(false); }}
        onKeyDown={e => { if (e.key === "Escape") close(); }}
      />
      {open && value && (
        <button className={styles.clear} aria-label="Limpar busca" onMouseDown={e => e.preventDefault()} onClick={close}>
          <X size={18} />
        </button>
      )}
    </div>
  );
}
