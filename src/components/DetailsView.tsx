import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import type { MediaType, TitleDetails } from "../api/types";
import { img, backdropSrcSet } from "../api/images";
import { TmdbError } from "../api/tmdb";
import { useTitle } from "../hooks/queries";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { episodeHref } from "../app/routes";
import { useHasSource } from "../player/sources";
import { useSeriesProgress } from "../storage/progress";
import { Certification } from "./Certification";
import { EpisodeList, SeasonSelect } from "./EpisodeList";
import { PlayButton } from "./PlayButton";
import { Skeleton } from "./Skeleton";
import { TitleCard, formatRuntime } from "./TitleCard";
import { TrailerButton } from "./Trailer";
import { WatchlistButton } from "./WatchlistButton";
import styles from "./DetailsView.module.css";

export function DetailsView({ type, id, page = false }: { type: MediaType; id: number; page?: boolean }) {
  const { data: t, isLoading, error, refetch } = useTitle(type, id);
  useDocumentTitle(t?.title);

  if (isLoading) return <DetailsSkeleton />;
  if (error || !t) {
    const notFound = error instanceof TmdbError && error.status === 404;
    return (
      <div className="empty" style={{ paddingTop: 96 }}>
        <p style={{ marginBottom: 16 }}>{notFound ? "Esse título não foi encontrado." : "A conexão tropeçou. Tentar de novo?"}</p>
        {!notFound && <button className="btn btn-primary" onClick={() => refetch()}>Tentar de novo</button>}
      </div>
    );
  }
  return <Details t={t} page={page} />;
}

function Details({ t, page }: { t: TitleDetails; page: boolean }) {
  const has = useHasSource(t.type, t.id);
  const ref = useRef<HTMLElement>(null);
  // Trocar de título dentro do modal volta para o topo
  useEffect(() => {
    const overlay = ref.current?.closest("[data-overlay]");
    if (overlay) overlay.scrollTop = 0;
    else window.scrollTo(0, 0);
  }, [t.key]);
  const duration =
    t.type === "movie"
      ? t.runtime ? formatRuntime(t.runtime) : null
      : t.seasons ? `${t.seasons.length} temporada${t.seasons.length === 1 ? "" : "s"}` : null;

  return (
    <article ref={ref} className={`${styles.details} ${page ? styles.page : ""}`}>
      <header className={styles.top}>
        <div className={styles.backdrop}>
          {t.backdrop && (
            <img
              src={img(t.backdrop, "w1280")!}
              srcSet={backdropSrcSet(t.backdrop)}
              sizes="(max-width: 900px) 100vw, 900px"
              alt=""
              onError={e => (e.currentTarget.style.visibility = "hidden")}
            />
          )}
        </div>
        <div className={styles.scrim} />
        <div className={styles.topContent}>
          {t.logo ? (
            <h1>
              <img className={styles.logo} src={img(t.logo, "w500")!} alt={t.title} />
            </h1>
          ) : (
            <h1 className={styles.titleText}>{t.title}</h1>
          )}
          <div className={styles.actions}>
            <PlayButton type={t.type} id={t.id} title={t.title} seasons={t.seasons} trailer={t.trailer} />
            {has && <TrailerButton trailer={t.trailer} title={t.title} />}
            <WatchlistButton item={t} variant="button" />
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.columns}>
          <div className={styles.left}>
            <div className="meta">
              {t.rating > 0 && (
                <span className={styles.rating}>
                  <Star size={14} fill="currentColor" /> {t.rating.toFixed(1)}
                </span>
              )}
              {t.year && <span>{t.year}</span>}
              {duration && <span>{duration}</span>}
              {t.certification && (
                <span>
                  <Certification value={t.certification} />
                </span>
              )}
              {t.status === "Returning Series" && <span className={styles.status}>Em produção</span>}
            </div>
            {t.tagline && <p className={styles.tagline}>{t.tagline}</p>}
            <p className={styles.overview}>{t.overview || "Sinopse ainda não disponível em português."}</p>
          </div>
          <dl className={styles.right}>
            {t.cast.length > 0 && <Credits label="Elenco" names={t.cast.map(c => c.name)} />}
            {t.genres.length > 0 && (
              <div>
                <dt>Gêneros:</dt> <dd>{t.genres.map(g => g.name).join(", ")}</dd>
              </div>
            )}
            {t.creators.length > 0 && (
              <div>
                <dt>{t.type === "movie" ? "Direção:" : "Criação:"}</dt> <dd>{t.creators.join(", ")}</dd>
              </div>
            )}
          </dl>
        </div>

        {t.type === "tv" && t.seasons && t.seasons.length > 0 && <SeriesEpisodes t={t} />}

        {has === false && <WhereToWatch t={t} />}

        {t.recommendations.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.h2}>Títulos semelhantes</h2>
            <div className={styles.similar}>
              {t.recommendations.filter(r => r.poster).slice(0, 9).map(r => (
                <TitleCard key={r.key} item={r} sizes="(max-width: 600px) 33vw, 200px" />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function Credits({ label, names }: { label: string; names: string[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? names : names.slice(0, 3);
  return (
    <div>
      <dt>{label}:</dt>{" "}
      <dd>
        {shown.join(", ")}
        {names.length > 3 && !all && (
          <>
            , <button className={styles.more} onClick={() => setAll(true)}>mais</button>
          </>
        )}
      </dd>
    </div>
  );
}

function SeriesEpisodes({ t }: { t: TitleDetails }) {
  const navigate = useNavigate();
  const progress = useSeriesProgress(t.id);
  const seasons = t.seasons!;
  const initial = progress?.current.season ?? seasons[0].number;
  const [season, setSeason] = useState(seasons.some(s => s.number === initial) ? initial : seasons[0].number);

  return (
    <section className={styles.section}>
      <div className={styles.episodesHead}>
        <h2 className={styles.h2}>Episódios</h2>
        <SeasonSelect seasons={seasons} value={season} onChange={setSeason} />
      </div>
      <EpisodeList tvId={t.id} season={season} onPick={(s, e) => navigate(episodeHref(t.id, s, e))} />
    </section>
  );
}

function WhereToWatch({ t }: { t: TitleDetails }) {
  return (
    <section className={`${styles.section} ${styles.where}`}>
      <h2 className={styles.h2}>Onde assistir</h2>
      <p className={styles.unavailable}>Ainda não disponível na Exuflix. Veja o trailer ou onde assistir.</p>
      {t.providersBR.length > 0 ? (
        <ul className={styles.providers}>
          {t.providersBR.map(p => (
            <li key={p.id}>
              <a href={t.providersLink ?? undefined} target="_blank" rel="noreferrer" title={p.name}>
                {p.logo ? <img src={img(p.logo, "w92")!} alt={p.name} loading="lazy" /> : <span>{p.name}</span>}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.muted}>Nenhum serviço de assinatura no Brasil por enquanto.</p>
      )}
      <p className={styles.attribution}>Dados de disponibilidade: JustWatch</p>
    </section>
  );
}

function DetailsSkeleton() {
  return (
    <div className={styles.details}>
      <Skeleton style={{ aspectRatio: "16 / 9", width: "100%", borderRadius: 0 }} />
      <div className={styles.body} style={{ display: "grid", gap: 12 }}>
        <Skeleton style={{ height: 20, width: "40%" }} />
        <Skeleton style={{ height: 16, width: "90%" }} />
        <Skeleton style={{ height: 16, width: "80%" }} />
      </div>
    </div>
  );
}
