import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import type { TitleSummary } from "../api/types";
import { img, backdropSrcSet, posterSrcSet } from "../api/images";
import { useGenres, useTitle, usePrefetchTitle } from "../hooks/queries";
import { useOpenTitle } from "../hooks/useOpenTitle";
import { Certification } from "./Certification";
import { PlayButton } from "./PlayButton";
import { formatRuntime } from "./TitleCard";
import { usePreferences } from "../storage/preferences";
import { Skeleton } from "./Skeleton";
import styles from "./Hero.module.css";

const ROTATE_MS = 8000;

export function Hero({ items, loading }: { items: TitleSummary[]; loading?: boolean }) {
  const slides = items.filter(i => i.backdrop && i.overview).slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const prefetch = usePrefetchTitle();
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Busca o logo de todos os destaques de uma vez
  useEffect(() => {
    slides.forEach(s => prefetch(s.type, s.id));
  }, [slides.map(s => s.key).join()]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (paused || previewing || reduced || slides.length < 2) return;
    const id = setTimeout(() => setIndex(i => (i + 1) % slides.length), ROTATE_MS);
    return () => clearTimeout(id);
  }, [index, paused, previewing, reduced, slides.length]);

  if (loading || slides.length === 0) {
    return (
      <div className={styles.hero}>
        <Skeleton className={styles.skeleton} />
      </div>
    );
  }

  return (
    <section
      className={styles.hero}
      aria-roledescription="carrossel"
      aria-label="Destaques"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <Slide key={s.key} item={s} active={i === index} first={i === 0} onPreview={setPreviewing} />
      ))}
      {slides.length > 1 && (
        <div className={styles.dots} role="tablist" aria-label="Escolher destaque">
          {slides.map((s, i) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={i === index}
              aria-label={`Destaque ${i + 1}: ${s.title}`}
              className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
              onClick={() => { setPreviewing(false); setIndex(i); }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Slide({ item, active, first, onPreview }: { item: TitleSummary; active: boolean; first: boolean; onPreview: (on: boolean) => void }) {
  const { data: details } = useTitle(item.type, item.id);
  const { data: genres } = useGenres(item.type);
  const { openDetails } = useOpenTitle();
  const ref = useRef<HTMLDivElement>(null);
  // Slides inativos saem da ordem de foco
  useEffect(() => {
    if (ref.current) ref.current.inert = !active;
  }, [active]);
  const preview = useTrailerPreview(active, details?.trailer?.key);
  useEffect(() => {
    if (active) onPreview(!!preview);
  }, [active, preview]); // eslint-disable-line react-hooks/exhaustive-deps
  const genreNames = (details?.genres ?? item.genreIds.map(id => genres?.find(g => g.id === id)).filter(Boolean))
    .slice(0, 2)
    .map(g => g!.name);

  const duration =
    item.type === "movie"
      ? details?.runtime ? formatRuntime(details.runtime) : null
      : details?.seasons ? `${details.seasons.length} temporada${details.seasons.length > 1 ? "s" : ""}` : null;

  return (
    <div ref={ref} className={`${styles.slide} ${active ? styles.active : ""}`} aria-hidden={!active}>
      <picture className={styles.media}>
        {item.poster && <source media="(max-width: 767px)" srcSet={posterSrcSet(item.poster) ?? img(item.poster)!} sizes="100vw" />}
        <img
          src={img(item.backdrop, "w1280")!}
          srcSet={backdropSrcSet(item.backdrop)}
          sizes="100vw"
          alt=""
          loading={first ? "eager" : "lazy"}
          decoding="async"
          // @ts-expect-error atributo ainda não tipado no React 18
          fetchpriority={first ? "high" : undefined}
          onError={e => (e.currentTarget.style.visibility = "hidden")}
        />
      </picture>
      {preview && (
        <iframe
          className={styles.preview}
          src={`https://www.youtube-nocookie.com/embed/${preview}?autoplay=1&mute=1&controls=0&loop=1&playlist=${preview}&modestbranding=1&rel=0&playsinline=1&disablekb=1&iv_load_policy=3`}
          title=""
          tabIndex={-1}
          aria-hidden
          allow="autoplay; encrypted-media"
          onLoad={e => e.currentTarget.classList.add(styles.previewOn)}
        />
      )}
      <div className={styles.scrim} />
      <div className={styles.content}>
        {details?.logo ? (
          <h1 className={styles.logoWrap}>
            <img className={styles.logo} src={img(details.logo, "w500")!} alt={item.title} />
          </h1>
        ) : (
          <h1 className={styles.titleText}>{item.title}</h1>
        )}
        <div className={`meta ${styles.meta}`}>
          {details?.certification && (
            <span className="no-dot">
              <Certification value={details.certification} />
            </span>
          )}
          {item.year && <span>{item.year}</span>}
          {duration && <span>{duration}</span>}
          {genreNames.map(g => (
            <span key={g}>{g}</span>
          ))}
        </div>
        <p className={styles.overview}>{item.overview}</p>
        <div className={styles.actions}>
          <PlayButton type={item.type} id={item.id} title={item.title} seasons={details?.seasons} trailer={details?.trailer} />
          <button className="btn btn-ghost" onClick={() => openDetails(item.type, item.id)}>
            <Info size={20} /> Mais informações
          </button>
        </div>
      </div>
    </div>
  );
}

/** Trailer mudo em loop após 3 s, só no desktop, com "Prévias automáticas" ligado e sem reduced-motion. */
function useTrailerPreview(active: boolean, key: string | undefined) {
  const [prefs] = usePreferences();
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(false);
    if (!active || !key || !prefs.autoplayPreviews) return;
    const ok =
      window.matchMedia("(min-width: 1024px) and (hover: hover)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!ok) return;
    const id = setTimeout(() => setOn(true), 3000);
    return () => clearTimeout(id);
  }, [active, key, prefs.autoplayPreviews]);
  return on ? key! : null;
}
