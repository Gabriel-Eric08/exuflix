import { useEffect, useRef, useCallback } from "react";
import { update } from "../storage/store";
import { EMPTY_PROGRESS, type ProgressStore, type MovieProgress } from "../storage/progress";

type Meta = { title: string; poster: string | null; backdrop: string | null };

export type Target =
  | { kind: "movie"; id: number; meta?: Meta | null; creditsStart?: number }
  | {
      kind: "episode";
      id: number;
      season: number;
      episode: number;
      meta?: (Meta & { episodeTitle?: string; still?: string | null }) | null;
      creditsStart?: number;
    };

const SAVE_EVERY_MS = 5000;
const MIN_WATCHED = 10;
const MAX_TITLES = 300;

export function isCompleted(pos: number, dur: number, kind: Target["kind"], creditsStart?: number) {
  if (!dur || !isFinite(dur)) return false;
  if (creditsStart && pos >= creditsStart) return true;
  if (pos / dur >= 0.95) return true;
  return dur - pos <= (kind === "movie" ? 180 : 60);
}

/** Mantém no máximo 300 títulos, descartando os mais antigos */
export function pruneOld(items: ProgressStore["items"]) {
  const entries = Object.entries(items);
  if (entries.length <= MAX_TITLES) return items;
  return Object.fromEntries(entries.sort((a, b) => b[1].updatedAt - a[1].updatedAt).slice(0, MAX_TITLES));
}

/** Aplica uma leitura de posição ao store (função pura, testável). */
export function applyProgress(store: ProgressStore, t: Target, pos: number, dur: number, ended: boolean, now: number): ProgressStore {
  const completed = ended || isCompleted(pos, dur, t.kind, t.creditsStart);
  const items = { ...store.items };
  const meta = t.meta!;

  if (t.kind === "movie") {
    const entry: MovieProgress = {
      type: "movie",
      id: t.id,
      position: completed ? 0 : pos,
      duration: dur,
      completed,
      updatedAt: now,
      meta: { title: meta.title, poster: meta.poster, backdrop: meta.backdrop },
    };
    items[`movie:${t.id}`] = entry;
  } else {
    const key = `tv:${t.id}`;
    const prev = items[key]?.type === "tv" ? items[key] : undefined;
    const epKey = `s${t.season}e${t.episode}`;
    const m = t.meta as NonNullable<Extract<Target, { kind: "episode" }>["meta"]>;
    items[key] = {
      type: "tv",
      id: t.id,
      current: { season: t.season, episode: t.episode },
      episodes: {
        ...(prev?.type === "tv" ? prev.episodes : {}),
        [epKey]: {
          position: completed ? dur : pos,
          duration: dur,
          completed,
          updatedAt: now,
          title: m.episodeTitle,
          still: m.still ?? null,
        },
      },
      updatedAt: now,
      meta: { title: m.title, poster: m.poster, backdrop: m.backdrop },
    };
  }
  return { items: pruneOld(items) };
}

/** Salva o progresso: a cada 5 s, ao pausar/pular/terminar, ao esconder a aba e ao sair do player. */
export function useProgressTracker(target: Target) {
  const last = useRef({ pos: 0, dur: 0, savedAt: 0 });
  const targetRef = useRef(target);
  targetRef.current = target;

  const save = useCallback((force = false, ended = false) => {
    const t = targetRef.current;
    const { pos, dur } = last.current;
    if (!t.meta || !dur || !isFinite(dur) || pos < MIN_WATCHED) return;
    if (!force && Date.now() - last.current.savedAt < SAVE_EVERY_MS) return;
    last.current.savedAt = Date.now();

    update<ProgressStore>("progress", EMPTY_PROGRESS, store => applyProgress(store, t, pos, dur, ended, Date.now()));
    // Voltou a assistir: o título sai da lista de removidos de "Continuar assistindo"
    const key = `${t.kind === "movie" ? "movie" : "tv"}:${t.id}`;
    update<string[]>("hidden", [], h => (h.includes(key) ? h.filter(k => k !== key) : h));
  }, []);

  useEffect(() => {
    const flush = () => save(true);
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
    };
  }, [save]);

  const at = (pos: number, dur: number) => {
    last.current.pos = pos;
    last.current.dur = dur;
  };

  return {
    onTime: (pos: number, dur: number) => {
      at(pos, dur);
      save(false);
    },
    onPause: (pos: number, dur: number) => {
      at(pos, dur);
      save(true);
    },
    onSeeked: (pos: number, dur: number) => {
      at(pos, dur);
      save(true);
    },
    onEnded: () => {
      last.current.pos = last.current.dur;
      save(true, true);
    },
  };
}
