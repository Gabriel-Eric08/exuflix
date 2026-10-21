import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { History, Search as SearchIcon } from "lucide-react";
import { liveHref, XT_BASE } from "../../app/routes";
import { Row, RowItem, SkeletonRow } from "../../components/Row";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useInView } from "../../hooks/useInView";
import { useStored } from "../../storage/useStored";
import { RECENT_LIVE_KEY, formatClock } from "../live";
import { nowNext } from "../normalize";
import { fold, useXtCategories, useXtEpg, useXtLive } from "../queries";
import type { LiveChannel } from "../types";
import { XtError } from "./shared";
import styles from "./LiveTV.module.css";


const NO_RECENT: number[] = [];
const PAGE = 120;

export const useRecentChannels = () => useStored<number[]>(RECENT_LIVE_KEY, NO_RECENT);

export default function LiveTV() {
  useDocumentTitle("Ao vivo");
  const [params, setParams] = useSearchParams();
  const { data: channels, isLoading, isError, error, refetch } = useXtLive();
  const { data: cats } = useXtCategories("live");
  const [recent] = useRecentChannels();
  const [filter, setFilter] = useState("");
  const [shown, setShown] = useState(PAGE);
  const cat = params.get("categoria");

  const counts = useMemo(() => {
    const m = new Map<number, number>();
    for (const c of channels ?? []) for (const id of c.categoryIds) m.set(id, (m.get(id) ?? 0) + 1);
    return m;
  }, [channels]);

  const list = useMemo(() => {
    let out = channels ?? [];
    if (cat === "recentes") {
      const byId = new Map(out.map(c => [c.id, c]));
      out = recent.map(id => byId.get(id)).filter((c): c is LiveChannel => !!c);
    } else if (cat) out = out.filter(c => c.categoryIds.includes(Number(cat)));
    const q = fold(filter.trim());
    if (q) out = out.filter(c => fold(c.name).includes(q));
    return out;
  }, [channels, cat, recent, filter]);

  const choose = (v: string | null) => {
    setShown(PAGE);
    setParams(p => {
      const n = new URLSearchParams(p);
      if (v) n.set("categoria", v);
      else n.delete("categoria");
      return n;
    }, { replace: true });
  };

  if (isError) return <main><XtError error={error} onRetry={() => refetch()} /></main>;

  const catOptions = (cats ?? []).filter(c => counts.has(c.id));

  return (
    <main className={`page ${styles.page}`}>
      <div className={styles.head}>
        <h1 className="page-title" style={{ padding: 0 }}>Ao vivo</h1>
        <label className={styles.filter}>
          <SearchIcon size={18} aria-hidden />
          <input type="search" placeholder="Buscar canal" value={filter} onChange={e => { setFilter(e.target.value); setShown(PAGE); }} aria-label="Buscar canal" />
        </label>
        <select className={`select ${styles.mobileCats}`} value={cat ?? ""} onChange={e => choose(e.target.value || null)} aria-label="Categoria">
          <option value="">Todos os canais</option>
          {recent.length > 0 && <option value="recentes">Assistidos recentemente</option>}
          {catOptions.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.layout}>
        <nav className={styles.cats} aria-label="Categorias de canais">
          <button aria-pressed={!cat} onClick={() => choose(null)}>
            Todos os canais <span>{channels?.length ?? ""}</span>
          </button>
          {recent.length > 0 && (
            <button aria-pressed={cat === "recentes"} onClick={() => choose("recentes")}>
              <History size={14} aria-hidden /> Assistidos recentemente
            </button>
          )}
          {catOptions.map(c => (
            <button key={c.id} aria-pressed={cat === String(c.id)} onClick={() => choose(String(c.id))}>
              {c.name} <span>{counts.get(c.id)}</span>
            </button>
          ))}
        </nav>

        <section className={styles.grid} aria-label="Canais" aria-busy={isLoading}>
          {isLoading
            ? Array.from({ length: 12 }, (_, i) => <div key={i} className={`${styles.card} ${styles.skeleton}`} />)
            : list.slice(0, shown).map(c => <ChannelCard key={c.key} channel={c} />)}
          {!isLoading && list.length === 0 && <p className="empty">Nenhum canal por aqui.</p>}
        </section>
      </div>
      {list.length > shown && (
        <div style={{ display: "grid", placeItems: "center", marginTop: 24 }}>
          <button className="btn btn-outline" onClick={() => setShown(s => s + PAGE)}>
            Mostrar mais canais ({list.length - shown})
          </button>
        </div>
      )}
    </main>
  );
}

/** Card de canal: logo, nome e o que está passando agora (EPG só quando aparece na tela). */
export function ChannelCard({ channel, compact = false }: { channel: LiveChannel; compact?: boolean }) {
  const navigate = useNavigate();
  const [ref, inView] = useInView<HTMLButtonElement>("200px");
  const { data: epg } = useXtEpg(channel.id, inView, 2);
  const { now } = nowNext(epg ?? []);
  const pct = now ? Math.min(1, Math.max(0, (Date.now() - now.start) / (now.end - now.start))) : 0;
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <button ref={ref} className={`${styles.card} ${compact ? styles.compact : ""}`} onClick={() => navigate(liveHref(channel.id))} data-card aria-label={`${channel.name}${now ? `, agora: ${now.title}` : ""}`}>
      <span className={styles.logo}>
        {channel.logo && !logoFailed ? (
          <img src={channel.logo} alt="" loading="lazy" decoding="async" onError={() => setLogoFailed(true)} />
        ) : (
          <span className={styles.initials} aria-hidden>{initials(channel.name)}</span>
        )}
      </span>
      <span className={styles.info}>
        <span className={styles.name}>{channel.name}</span>
        {now ? (
          <>
            <span className={styles.now}>{now.title}</span>
            <span className={`${styles.time} tabular`}>{formatClock(now.start)} – {formatClock(now.end)}</span>
            <span className={styles.bar} aria-hidden>
              <span style={{ width: `${pct * 100}%` }} />
            </span>
          </>
        ) : (
          <span className={styles.time}>{channel.archive ? "Ao vivo · com replay" : "Ao vivo"}</span>
        )}
      </span>
    </button>
  );
}

/** Linha de canais na home: recentes primeiro, depois os primeiros da lista. */
export function LiveRow() {
  const { data: channels, isLoading } = useXtLive();
  const [recent] = useRecentChannels();
  if (isLoading) return <SkeletonRow title="Canais ao vivo" variant="wide" />;
  if (!channels || channels.length === 0) return null;
  const byId = new Map(channels.map(c => [c.id, c]));
  const first = recent.map(id => byId.get(id)).filter((c): c is LiveChannel => !!c);
  const rest = channels.filter(c => !recent.includes(c.id)).slice(0, 20 - Math.min(first.length, 20));
  return (
    <Row title={first.length ? "Seus canais" : "Canais ao vivo"} seeAllHref={`${XT_BASE}/ao-vivo`} variant="wide">
      {[...first, ...rest].slice(0, 20).map(c => (
        <RowItem key={c.key}>
          <ChannelCard channel={c} compact />
        </RowItem>
      ))}
    </Row>
  );
}

/** "Canal Um HD" → "CU" (logo ausente) */
function initials(name: string) {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(w => w && !/^(hd|fhd|sd|4k|uhd)$/i.test(w));
  return words.slice(0, 2).map(w => w[0]).join("").toUpperCase() || "TV";
}
