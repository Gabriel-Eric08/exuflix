import { useQuery } from "@tanstack/react-query";
import type { MediaType } from "../api/types";

export interface VideoSource {
  kind: "hls" | "mp4";
  url: string;
  subtitles?: { lang: string; label: string; url: string }[];
  markers?: { introStart?: number; introEnd?: number; creditsStart?: number };
  attribution?: string;
}

export interface SourceRegistry {
  version: number;
  movies?: Record<string, VideoSource>;
  series?: Record<string, { seasons: Record<string, Record<string, VideoSource>> }>;
}

let registry: Promise<SourceRegistry> | null = null;
export const loadRegistry = () =>
  (registry ??= fetch("/sources.json")
    .then(r => (r.ok ? r.json() : { version: 1 }))
    .catch(() => ({ version: 1 }))) as Promise<SourceRegistry>;

export async function resolveMovie(id: number): Promise<VideoSource | null> {
  return (await loadRegistry()).movies?.[id] ?? null;
}

export async function resolveEpisode(id: number, s: number, e: number): Promise<VideoSource | null> {
  return (await loadRegistry()).series?.[id]?.seasons?.[s]?.[e] ?? null;
}

export async function hasSource(type: MediaType, id: number) {
  const r = await loadRegistry();
  return type === "movie" ? !!r.movies?.[id] : !!r.series?.[id];
}

export const useRegistry = () =>
  useQuery({ queryKey: ["sources"], queryFn: loadRegistry, staleTime: Infinity });

export function useHasSource(type: MediaType, id: number) {
  const { data } = useRegistry();
  if (!data) return undefined;
  return type === "movie" ? !!data.movies?.[id] : !!data.series?.[id];
}

/** Episódios com fonte de uma série: Set de "s1e2". */
export function useEpisodeSources(id: number) {
  const { data } = useRegistry();
  const seasons = data?.series?.[id]?.seasons;
  const set = new Set<string>();
  if (seasons) for (const [s, eps] of Object.entries(seasons)) for (const e of Object.keys(eps)) set.add(`s${s}e${e}`);
  return set;
}
