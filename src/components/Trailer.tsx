import { useSyncExternalStore } from "react";
import { Film } from "lucide-react";
import { Modal } from "./Modal";
import styles from "./Trailer.module.css";

type TrailerState = { key: string; title: string } | null;
let state: TrailerState = null;
const listeners = new Set<() => void>();
const set = (s: TrailerState) => {
  state = s;
  listeners.forEach(l => l());
};

export const openTrailer = (key: string, title: string) => set({ key, title });

/** Modal global do trailer (player oficial do YouTube, domínio sem cookies). */
export function TrailerHost() {
  const t = useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
  if (!t) return null;
  return (
    <Modal onClose={() => set(null)} label={`Trailer de ${t.title}`} size="video">
      <div className={styles.frame}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${t.key}?autoplay=1&rel=0&modestbranding=1&hl=pt-BR&cc_lang_pref=pt`}
          title={`Trailer de ${t.title}`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    </Modal>
  );
}

export function TrailerButton({ trailer, title, primary = false }: { trailer: { key: string } | null; title: string; primary?: boolean }) {
  if (!trailer) return null;
  return (
    <button className={`btn ${primary ? "btn-light" : "btn-ghost"}`} onClick={() => openTrailer(trailer.key, title)}>
      <Film size={20} /> Trailer
    </button>
  );
}
