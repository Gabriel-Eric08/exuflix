import { useStored } from "./useStored";

export interface MetaSnapshot {
  title: string;
  poster: string | null;
  backdrop: string | null;
}

export interface MovieProgress {
  type: "movie";
  id: number;
  position: number;
  duration: number;
  completed: boolean;
  updatedAt: number;
  meta: MetaSnapshot;
}

export interface EpisodeProgress {
  position: number;
  duration: number;
  completed: boolean;
  updatedAt: number;
  title?: string;
  still?: string | null;
}

export interface SeriesProgress {
  type: "tv";
  id: number;
  current: { season: number; episode: number };
  episodes: Record<string, EpisodeProgress>; // "s2e5"
  updatedAt: number;
  meta: MetaSnapshot;
}

export interface ProgressStore {
  items: Record<string, MovieProgress | SeriesProgress>;
}

export const EMPTY_PROGRESS: ProgressStore = { items: {} };

export const useProgressStore = () => useStored<ProgressStore>("progress", EMPTY_PROGRESS)[0];

export function useMovieProgress(id: number) {
  const store = useProgressStore();
  const p = store.items[`movie:${id}`];
  return p?.type === "movie" ? p : undefined;
}

export function useSeriesProgress(id: number) {
  const store = useProgressStore();
  const p = store.items[`tv:${id}`];
  return p?.type === "tv" ? p : undefined;
}

export function useEpisodeProgress(id: number, s: number, e: number) {
  return useSeriesProgress(id)?.episodes[`s${s}e${e}`];
}

export const shouldOfferResume = (p: { position: number; completed: boolean }) => !p.completed && p.position > 30;

export const resumePoint = (p: { position: number }) => Math.max(0, p.position - 5);
