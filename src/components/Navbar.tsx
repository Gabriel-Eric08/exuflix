import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, X, Home, Tv, Clapperboard, Bookmark, LayoutGrid } from "lucide-react";
import { Symbol, Wordmark } from "./Logo";
import styles from "./Navbar.module.css";

const LINKS = [
  { to: "/", label: "Início", icon: Home, end: true },
  { to: "/series", label: "Séries", icon: Tv },
  { to: "/filmes", label: "Filmes", icon: Clapperboard },
  { to: "/categorias", label: "Categorias", icon: LayoutGrid },
  { to: "/minha-lista", label: "Minha lista", icon: Bookmark },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
        <Link to="/" className={styles.brand} aria-label="Exuflix, início">
          <Wordmark className={styles.wordmark} />
          <span className={styles.symbol}>
            <Symbol size={30} plate={false} />
          </span>
        </Link>
        <nav className={styles.links} aria-label="Principal">
          {LINKS.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? styles.active : undefined)}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <SearchBox key={location.pathname === "/busca" ? "search" : "other"} />
      </header>

      <nav className={styles.tabbar} aria-label="Navegação inferior">
        {LINKS.filter(l => l.to !== "/categorias")
          .flatMap(l => (l.to === "/minha-lista" ? [{ to: "/busca", label: "Busca", icon: Search }, l] : [l]))
          .map(l => (
            <NavLink key={l.to} to={l.to} end={"end" in l ? l.end : false} className={({ isActive }) => (isActive ? styles.tabActive : undefined)}>
              <l.icon size={22} aria-hidden />
              <span>{l.label}</span>
            </NavLink>
          ))}
      </nav>
    </>
  );
}

function SearchBox() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const onSearchPage = location.pathname === "/busca";
  const [open, setOpen] = useState(onSearchPage);
  const [value, setValue] = useState(onSearchPage ? params.get("q") ?? "" : "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Atalho "/" foca a busca em qualquer página
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== "/" || el.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      if (window.matchMedia("(max-width: 767px)").matches) return navigate("/busca");
      setOpen(true);
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  // Debounce de 300 ms: a URL é a fonte da verdade da página de busca
  useEffect(() => {
    if (!open) return;
    const q = value.trim();
    if (!onSearchPage && !q) return;
    const id = setTimeout(() => {
      if (q === (params.get("q") ?? "") && onSearchPage) return;
      navigate(q ? `/busca?q=${encodeURIComponent(q)}` : "/busca", { replace: onSearchPage });
    }, 300);
    return () => clearTimeout(id);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    setValue("");
    setOpen(false);
    if (onSearchPage) navigate("/");
  };

  return (
    <div className={`${styles.search} ${open ? styles.searchOpen : ""}`}>
      <button
        className={styles.searchBtn}
        aria-label="Buscar"
        onClick={() => {
          if (window.matchMedia("(max-width: 767px)").matches) return navigate("/busca");
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
        placeholder="Títulos, gente, gêneros"
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
